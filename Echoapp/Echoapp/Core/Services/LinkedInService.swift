//
//  LinkedInService.swift
//  Kuil
//
//  Created by Claude on 16/01/2026.
//

import Foundation
import AuthenticationServices

@MainActor
class LinkedInService: NSObject, ObservableObject {
    static let shared = LinkedInService()

    @Published var isAuthenticated = false
    @Published var userProfile: LinkedInProfile?

    // Keep strong reference to auth session during OAuth flow
    private var authSession: ASWebAuthenticationSession?
    private var authContinuation: CheckedContinuation<String, Error>?

    private override init() {
        super.init()
        checkAuthStatus()
    }

    // MARK: - Authentication

    func checkAuthStatus() {
        isAuthenticated = KeychainService.hasJWT()
    }

    /// Initiate LinkedIn OAuth flow with automatic retry
    func signIn(from window: UIWindow?, retryCount: Int = 0) async throws -> String {
        let maxRetries = 2

        do {
            return try await performSignIn(from: window)
        } catch {
            // If first attempt fails with specific errors, retry once
            if retryCount < maxRetries {
                let shouldRetry = (error as? ASWebAuthenticationSessionError)?.code == .canceledLogin ||
                                  error.localizedDescription.contains("cancelled") ||
                                  error.localizedDescription.contains("invalidCallback")

                if shouldRetry {
                    print("🔄 LinkedIn auth failed, retrying... (attempt \(retryCount + 2)/\(maxRetries + 1))")
                    // Small delay before retry
                    try await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
                    return try await signIn(from: window, retryCount: retryCount + 1)
                }
            }
            throw error
        }
    }

    /// Internal sign in implementation
    private func performSignIn(from window: UIWindow?) async throws -> String {
        // Cancel any existing session
        authSession?.cancel()
        authSession = nil
        authContinuation = nil

        let authURL = URL(string: Config.backendURL + Config.Endpoints.authLinkedIn)!

        return try await withCheckedThrowingContinuation { [weak self] continuation in
            guard let self = self else {
                continuation.resume(throwing: LinkedInError.invalidCallback)
                return
            }

            // Store continuation to prevent deallocation
            self.authContinuation = continuation

            let session = ASWebAuthenticationSession(
                url: authURL,
                callbackURLScheme: Config.appURLScheme
            ) { [weak self] callbackURL, error in
                guard let self = self else { return }

                // CRITICAL: Only resume continuation once
                guard let storedContinuation = self.authContinuation else {
                    print("⚠️ Continuation already resumed, ignoring callback")
                    return
                }
                self.authContinuation = nil  // Clear immediately to prevent double resume

                if let error = error {
                    print("❌ LinkedIn OAuth error: \(error.localizedDescription)")
                    storedContinuation.resume(throwing: error)
                    return
                }

                guard let url = callbackURL,
                      let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
                    storedContinuation.resume(throwing: LinkedInError.invalidCallback)
                    return
                }

                // Check for error in callback
                if let errorParam = components.queryItems?.first(where: { $0.name == "error" })?.value {
                    print("❌ LinkedIn callback error: \(errorParam)")
                    storedContinuation.resume(throwing: LinkedInError.invalidCallback)
                    return
                }

                guard let token = components.queryItems?.first(where: { $0.name == "token" })?.value else {
                    print("❌ No token in LinkedIn callback")
                    storedContinuation.resume(throwing: LinkedInError.invalidCallback)
                    return
                }

                // Save JWT token
                do {
                    try KeychainService.saveJWT(token)
                    self.isAuthenticated = true
                    print("✅ LinkedIn auth successful")
                    storedContinuation.resume(returning: token)
                } catch {
                    storedContinuation.resume(throwing: error)
                }
            }

            // Store strong reference
            self.authSession = session

            session.presentationContextProvider = self
            // Use ephemeral session to ensure fresh OAuth state each time
            // This prevents invalid_state errors from cached/stale OAuth requests
            session.prefersEphemeralWebBrowserSession = true

            // Start the session
            if !session.start() {
                print("❌ Failed to start ASWebAuthenticationSession")
                // Only resume if continuation hasn't been used yet
                if let storedContinuation = self.authContinuation {
                    self.authContinuation = nil
                    storedContinuation.resume(throwing: LinkedInError.invalidCallback)
                }
            }
        }
    }

    /// Sign out (delete JWT)
    func signOut() {
        do {
            try KeychainService.deleteJWT()
            isAuthenticated = false
            userProfile = nil
        } catch {
            print("❌ Error signing out: \(error)")
        }
    }

    // MARK: - Analytics OAuth (Community Management API)

    /// Connect LinkedIn Analytics (separate OAuth for Community Management API)
    func connectAnalytics(from window: UIWindow?) async throws -> Bool {
        // Cancel any existing session
        authSession?.cancel()
        authSession = nil
        authContinuation = nil

        // Get JWT token for authentication
        guard let jwt = try? KeychainService.getJWT(), let token = jwt else {
            throw LinkedInError.invalidCallback
        }

        // Include JWT in query parameter for browser-based OAuth flow
        let authURL = URL(string: Config.backendURL + "/auth/linkedin-analytics?token=\(token)")!

        return try await withCheckedThrowingContinuation { [weak self] continuation in
            guard let self = self else {
                continuation.resume(throwing: LinkedInError.invalidCallback)
                return
            }

            let session = ASWebAuthenticationSession(
                url: authURL,
                callbackURLScheme: Config.appURLScheme
            ) { callbackURL, error in
                if let error = error {
                    // User cancelled is not an error
                    if (error as? ASWebAuthenticationSessionError)?.code == .canceledLogin {
                        continuation.resume(returning: false)
                        return
                    }
                    print("❌ Analytics OAuth error: \(error.localizedDescription)")
                    continuation.resume(throwing: error)
                    return
                }

                guard let url = callbackURL,
                      let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
                    continuation.resume(throwing: LinkedInError.invalidCallback)
                    return
                }

                // Check for error in callback
                if let errorParam = components.queryItems?.first(where: { $0.name == "analytics_error" })?.value {
                    print("❌ Analytics callback error: \(errorParam)")
                    continuation.resume(throwing: LinkedInError.invalidCallback)
                    return
                }

                // Check for success
                if components.queryItems?.first(where: { $0.name == "analytics_connected" })?.value == "true" {
                    print("✅ LinkedIn Analytics connected successfully")
                    continuation.resume(returning: true)
                    return
                }

                continuation.resume(returning: false)
            }

            // Store strong reference
            self.authSession = session

            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = true

            if !session.start() {
                print("❌ Failed to start Analytics OAuth session")
                continuation.resume(throwing: LinkedInError.invalidCallback)
            }
        }
    }

    // MARK: - Profile

    /// Fetch user's LinkedIn profile
    func fetchProfile() async throws -> LinkedInProfile {
        let profile: LinkedInProfileResponse = try await APIClient.shared.get(
            endpoint: Config.Endpoints.linkedInProfile
        )

        userProfile = profile.profile

        return profile.profile
    }

    // MARK: - Posts

    /// Fetch user's LinkedIn posts
    func fetchPosts() async throws -> [LinkedInPost] {
        let response: LinkedInPostsResponse = try await APIClient.shared.get(
            endpoint: Config.Endpoints.linkedInPosts
        )

        return response.posts
    }

    /// Publish a new post to LinkedIn
    func publishPost(content: String) async throws -> String {
        let body: [String: Any] = ["content": content]

        let response: PublishPostResponse = try await APIClient.shared.post(
            endpoint: Config.Endpoints.linkedInPublish,
            body: body
        )

        return response.postId
    }
}

// MARK: - ASWebAuthenticationPresentationContextProviding

extension LinkedInService: ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        // Get the first active window scene
        guard let windowScene = UIApplication.shared.connectedScenes
            .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene,
              let window = windowScene.windows.first(where: { $0.isKeyWindow }) else {
            return ASPresentationAnchor()
        }
        return window
    }
}

// MARK: - Models

struct LinkedInProfile: Codable {
    let id: String
    let firstName: String
    let lastName: String
    let headline: String?
    let profilePicture: String?

    var fullName: String {
        "\(firstName) \(lastName)"
    }
}

struct LinkedInPost: Codable, Identifiable {
    let id: String
    let content: String
    let createdAt: Date
    let likes: Int?
    let comments: Int?
    let shares: Int?

    enum CodingKeys: String, CodingKey {
        case id
        case content
        case createdAt = "created_at"
        case likes
        case comments
        case shares
    }
}

// MARK: - Response Models

struct LinkedInProfileResponse: Codable {
    let profile: LinkedInProfile
}

struct LinkedInPostsResponse: Codable {
    let posts: [LinkedInPost]
    let total: Int
}

struct PublishPostResponse: Codable {
    let success: Bool
    let postId: String

    enum CodingKeys: String, CodingKey {
        case success
        case postId = "post_id"
    }
}

// MARK: - Errors

enum LinkedInError: Error {
    case invalidCallback
    case authCancelled
    case noProfile
}
