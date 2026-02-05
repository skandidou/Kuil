//
//  UserService.swift
//  Kuil
//
//  Created by Claude on 2026-01-17.
//

import Foundation

// MARK: - Response Models

struct UserProfileResponse: Codable {
    let id: String
    let linkedinId: String
    var name: String  // Mutable for updates
    let email: String
    let profilePicture: String?
    let headline: String?
    var voiceSignature: VoiceSignatureData?  // Mutable for updates
    var persona: String?           // "Visionary", "Practitioner", "Storyteller" - Mutable for updates
    var role: String?              // "Founder", "Job Seeker", etc. - Mutable for updates
    let calibrationPreferences: [Bool]?  // 12 tone calibration swipe results
    let createdAt: String
    let lastLoginAt: String
}

struct VoiceSignatureData: Codable {
    let formal: Double
    let bold: Double
    let empathetic: Double
    let complexity: Double
    let brevity: Double
    let primaryTone: String
    let confidence: Double
    let lastAnalyzedAt: String?
    let postsAnalyzed: Int?
}

struct UserStatsResponse: Codable {
    let totalPosts: Int
    let generatedPosts: Int
    let publishedPosts: Int
    let averageHookScore: Int
    let visibilityScore: Int  // Now received directly from backend
}

// MARK: - User Service

class UserService {
    static let shared = UserService()

    private init() {}

    /// Fetch complete user profile with voice signature
    func fetchProfile() async throws -> UserProfileResponse {
        print("📥 Fetching user profile...")

        let response: UserProfileResponse = try await APIClient.shared.get(
            endpoint: Config.Endpoints.userProfile,
            requiresAuth: true
        )

        print("✅ Profile fetched:", response.name)
        return response
    }

    /// Fetch user statistics
    func fetchStats() async throws -> UserStatsResponse {
        print("📊 Fetching user stats...")

        let response: UserStatsResponse = try await APIClient.shared.get(
            endpoint: Config.Endpoints.userStats,
            requiresAuth: true
        )

        print("✅ Stats fetched: \(response.totalPosts) posts, visibility: \(response.visibilityScore)")
        return response
    }

    /// Sync LinkedIn posts to refresh cached data
    func syncLinkedInPosts() async throws {
        print("🔄 Syncing LinkedIn posts...")

        struct SyncResponse: Codable {
            let success: Bool
            let postsCount: Int
        }

        let response: SyncResponse = try await APIClient.shared.post(
            endpoint: "/api/linkedin/sync-posts",
            body: [:],
            requiresAuth: true
        )

        print("✅ Synced \(response.postsCount) LinkedIn posts")
    }
}
