//
//  APIClient.swift
//  Kuil
//
//  Created by Claude on 16/01/2026.
//

import Foundation

enum APIError: Error, LocalizedError {
    case invalidURL
    case noToken
    case networkError(Error)
    case invalidResponse
    case serverError(Int, String)
    case decodingError(Error)
    case maxRetriesExceeded

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .noToken:
            return "Authentication required. Please sign in again."
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .invalidResponse:
            return "Invalid server response"
        case .serverError(let code, let message):
            return "Server error (\(code)): \(message)"
        case .decodingError:
            return "Failed to process server response"
        case .maxRetriesExceeded:
            return "Request failed after multiple attempts. Please try again."
        }
    }
}

class APIClient {
    static let shared = APIClient()

    // Retry configuration
    private let maxRetries = 3
    private let initialRetryDelay: UInt64 = 1_000_000_000 // 1 second in nanoseconds

    private init() {}

    // MARK: - Retry Logic Helper

    /// Check if error is retryable (429, 5xx, timeout)
    private func isRetryableError(_ error: Error) -> Bool {
        if let apiError = error as? APIError {
            switch apiError {
            case .serverError(let code, _):
                return code == 429 || (500...599).contains(code)
            case .networkError:
                return true // Network errors are retryable
            default:
                return false
            }
        }
        return false
    }

    // MARK: - Generic Request with Retry
    func request<T: Decodable>(
        endpoint: String,
        method: String = "GET",
        body: [String: Any]? = nil,
        requiresAuth: Bool = true,
        timeoutSeconds: TimeInterval = 30
    ) async throws -> T {
        var lastError: Error?

        for attempt in 1...maxRetries {
            do {
                return try await executeRequest(
                    endpoint: endpoint,
                    method: method,
                    body: body,
                    requiresAuth: requiresAuth,
                    timeoutSeconds: timeoutSeconds
                )
            } catch {
                lastError = error

                // Check if we should retry
                if attempt < maxRetries && isRetryableError(error) {
                    let delay = initialRetryDelay * UInt64(pow(2.0, Double(attempt - 1)))
                    #if DEBUG
                    print("⚠️ Request failed (attempt \(attempt)/\(maxRetries)), retrying in \(delay / 1_000_000_000)s...")
                    #endif
                    try? await Task.sleep(nanoseconds: delay)
                    continue
                }

                // Not retryable or max retries reached
                throw error
            }
        }

        throw lastError ?? APIError.maxRetriesExceeded
    }

    /// Internal request execution (single attempt)
    private func executeRequest<T: Decodable>(
        endpoint: String,
        method: String,
        body: [String: Any]?,
        requiresAuth: Bool,
        timeoutSeconds: TimeInterval = 30
    ) async throws -> T {
        // Build URL
        guard let url = URL(string: Config.backendURL + endpoint) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = timeoutSeconds

        // Add JWT token if authentication is required
        if requiresAuth {
            guard let token = try? KeychainService.getJWT(), !token.isEmpty else {
                throw APIError.noToken
            }
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        // Add body if provided
        if let body = body {
            request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        }

        // Debug logging
        #if DEBUG
        print("📡 API Request: \(method) \(endpoint) (timeout: \(timeoutSeconds)s)")
        if let bodyData = request.httpBody,
           let bodyString = String(data: bodyData, encoding: .utf8) {
            print("📦 Body: \(bodyString)")
        }
        #endif

        // Execute request
        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }

            #if DEBUG
            print("✅ Response: \(httpResponse.statusCode)")
            if let responseString = String(data: data, encoding: .utf8) {
                print("📥 Data: \(responseString)")
            }
            #endif

            // Check status code
            guard (200...299).contains(httpResponse.statusCode) else {
                let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
                throw APIError.serverError(httpResponse.statusCode, errorMessage)
            }

            // Decode response
            do {
                let decoder = JSONDecoder()
                decoder.dateDecodingStrategy = .iso8601
                let decoded = try decoder.decode(T.self, from: data)
                return decoded
            } catch {
                throw APIError.decodingError(error)
            }

        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError(error)
        }
    }

    // MARK: - Convenience Methods

    /// GET request
    func get<T: Decodable>(
        endpoint: String,
        requiresAuth: Bool = true
    ) async throws -> T {
        return try await request(
            endpoint: endpoint,
            method: "GET",
            requiresAuth: requiresAuth
        )
    }

    /// POST request
    func post<T: Decodable>(
        endpoint: String,
        body: [String: Any],
        requiresAuth: Bool = true
    ) async throws -> T {
        return try await request(
            endpoint: endpoint,
            method: "POST",
            body: body,
            requiresAuth: requiresAuth
        )
    }

    /// PUT request
    func put<T: Decodable>(
        endpoint: String,
        body: [String: Any],
        requiresAuth: Bool = true
    ) async throws -> T {
        return try await request(
            endpoint: endpoint,
            method: "PUT",
            body: body,
            requiresAuth: requiresAuth
        )
    }

    /// DELETE request
    func delete<T: Decodable>(
        endpoint: String,
        requiresAuth: Bool = true
    ) async throws -> T {
        return try await request(
            endpoint: endpoint,
            method: "DELETE",
            requiresAuth: requiresAuth
        )
    }

    // MARK: - Non-Retryable Methods (for non-idempotent operations)

    /// POST request WITHOUT retry (for non-idempotent operations like publish)
    /// Use this for actions that should not be retried on failure (e.g., posting to LinkedIn)
    func postNoRetry<T: Decodable>(
        endpoint: String,
        body: [String: Any],
        requiresAuth: Bool = true
    ) async throws -> T {
        return try await executeRequest(
            endpoint: endpoint,
            method: "POST",
            body: body,
            requiresAuth: requiresAuth
        )
    }

    // MARK: - Long-running Requests (for AI generation)

    /// POST request with extended timeout for AI generation
    /// Use this for Claude/AI endpoints that may take longer to respond
    func postLongRunning<T: Decodable>(
        endpoint: String,
        body: [String: Any],
        requiresAuth: Bool = true,
        timeoutSeconds: TimeInterval = 90
    ) async throws -> T {
        return try await request(
            endpoint: endpoint,
            method: "POST",
            body: body,
            requiresAuth: requiresAuth,
            timeoutSeconds: timeoutSeconds
        )
    }

    // MARK: - Health Check
    func checkHealth() async throws -> HealthResponse {
        return try await get(endpoint: "/health", requiresAuth: false)
    }
}

// MARK: - Response Models

struct HealthResponse: Codable {
    let status: String
    let database: String?
    let timestamp: Date?
}

struct ErrorResponse: Codable {
    let error: String
    let message: String?
}
