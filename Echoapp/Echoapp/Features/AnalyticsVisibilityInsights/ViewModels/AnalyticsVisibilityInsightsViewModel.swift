//
//  AnalyticsVisibilityInsightsViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

// MARK: - API Response Models

struct AnalyticsResponse: Codable {
    // Analytics connection status
    let analyticsConnected: Bool?
    let analyticsExpired: Bool?
    let message: String?

    // Core visibility metrics
    let visibilityScore: Double
    let scoreChange: Double

    // LinkedIn Community Management API data
    let followerCount: Int?
    let connectionCount: Int?
    let totalImpressions: Int?
    let totalMembersReached: Int?
    let totalReactions: Int?
    let totalComments: Int?
    let totalReshares: Int?
    let engagementRate: Double?

    // Legacy fields (for backwards compatibility)
    let totalPosts: Int?
    let publishedPosts: Int?
    let totalEngagement: Int?
    let totalLikes: Int?
    let totalShares: Int?
    let avgHookScore: Int?

    // Top posts
    let topPosts: [TopPostData]?

    // Metadata
    let lastUpdated: String?
}

struct AnalyticsStatusResponse: Codable {
    let connected: Bool
    let expired: Bool?
}

struct TopPostData: Codable {
    let id: String
    let title: String
    let likes: Int
    let comments: Int
    let impressions: Int?
    let postedAt: String
}

struct FollowerAnalyticsResponse: Codable {
    let currentCount: Int
    let previousCount: Int
    let change: Int
    let changePercent: Double
    let trends: [FollowerTrendData]
}

struct FollowerTrendData: Codable {
    let date: String
    let count: Int
}

struct SyncResponse: Codable {
    let success: Bool
    let snapshot: SnapshotData?
}

struct SnapshotData: Codable {
    let visibilityScore: Int
    let followerCount: Int
    let connectionCount: Int
    let totalImpressions: Int
    let engagementRate: Double
    let snapshotDate: String
}

struct InsightsResponse: Codable {
    let insights: [InsightData]
}

struct InsightData: Codable {
    let icon: String
    let text: String
}

@MainActor
class AnalyticsVisibilityInsightsViewModel: ObservableObject {
    // Analytics connection status
    @Published var analyticsConnected: Bool = false
    @Published var analyticsExpired: Bool = false

    // Core metrics
    @Published var visibilityScore: Double = 0.0
    @Published var scoreChange: Double = 0.0

    // LinkedIn Community Management API metrics
    @Published var followerCount: Int = 0
    @Published var connectionCount: Int = 0
    @Published var totalImpressions: Int = 0
    @Published var totalMembersReached: Int = 0
    @Published var totalReactions: Int = 0
    @Published var totalComments: Int = 0
    @Published var totalReshares: Int = 0
    @Published var engagementRate: Double = 0.0

    // Content
    @Published var topPosts: [TopPostModel] = []
    @Published var insights: [InsightModel] = []
    @Published var followerTrends: [FollowerTrendData] = []

    // Best Times to Post
    @Published var bestTimesHeatmap: [[Double]] = []
    @Published var topPostingSlots: [PostingSlot] = []
    @Published var bestTimesDataSource: String = "linkedin_defaults"
    @Published var isLoadingBestTimes: Bool = false

    // Loading states
    @Published var isLoading: Bool = false
    @Published var isLoadingInsights: Bool = false
    @Published var isSyncing: Bool = false
    @Published var isConnectingAnalytics: Bool = false

    // Error states
    @Published var needsReauth: Bool = false
    @Published var lastUpdated: Date?

    private var cancellables = Set<AnyCancellable>()

    init() {
        // Subscribe to AppState for real-time user stats
        AppState.shared.$userStats
            .compactMap { $0 }
            .sink { [weak self] stats in
                self?.visibilityScore = Double(stats.visibilityScore)
            }
            .store(in: &cancellables)

        loadAnalytics()
        loadInsights()
        loadBestTimes()
    }

    func loadAnalytics() {
        Task {
            await fetchAnalytics()
        }
    }

    func fetchAnalytics() async {
        isLoading = true
        needsReauth = false

        do {
            print("📊 Fetching analytics data...")

            // Call backend to get analytics
            let response: AnalyticsResponse = try await APIClient.shared.get(
                endpoint: "/api/analytics",
                requiresAuth: true
            )

            await MainActor.run {
                // Check analytics connection status
                self.analyticsConnected = response.analyticsConnected ?? false
                self.analyticsExpired = response.analyticsExpired ?? false

                // Core metrics
                self.visibilityScore = response.visibilityScore
                self.scoreChange = response.scoreChange

                // LinkedIn Community Management API data
                self.followerCount = response.followerCount ?? 0
                self.connectionCount = response.connectionCount ?? 0
                self.totalImpressions = response.totalImpressions ?? 0
                self.totalMembersReached = response.totalMembersReached ?? 0
                self.totalReactions = response.totalReactions ?? 0
                self.totalComments = response.totalComments ?? 0
                self.totalReshares = response.totalReshares ?? 0
                self.engagementRate = response.engagementRate ?? 0.0

                // Top posts
                if let posts = response.topPosts {
                    self.topPosts = posts.map { post in
                        TopPostModel(
                            title: post.title,
                            likes: formatNumber(post.likes),
                            comments: String(post.comments),
                            impressions: post.impressions != nil ? formatNumber(post.impressions!) : nil
                        )
                    }
                }

                // Last updated
                if let lastUpdatedStr = response.lastUpdated {
                    let formatter = ISO8601DateFormatter()
                    formatter.formatOptions = [.withFullDate]
                    self.lastUpdated = formatter.date(from: lastUpdatedStr)
                }
            }

            print("✅ Analytics loaded: connected=\(response.analyticsConnected ?? false), visibility=\(response.visibilityScore)")
        } catch let error as APIError {
            print("❌ Failed to load analytics: \(error)")

            if error.isScopeError {
                await MainActor.run {
                    self.needsReauth = true
                }
            } else {
                await MainActor.run {
                    self.analyticsConnected = false
                    self.visibilityScore = 0.0
                    self.scoreChange = 0.0
                    self.topPosts = []
                }
            }
        } catch {
            print("❌ Failed to load analytics: \(error)")
            await MainActor.run {
                self.analyticsConnected = false
                self.visibilityScore = 0.0
                self.scoreChange = 0.0
                self.topPosts = []
            }
        }

        isLoading = false
    }

    /// Connect LinkedIn Analytics (opens OAuth flow for Community Management API)
    func connectAnalytics() {
        isConnectingAnalytics = true

        // Validate the analytics OAuth URL
        guard URL(string: "\(Config.backendURL)/auth/linkedin-analytics") != nil else {
            isConnectingAnalytics = false
            return
        }

        // Use ASWebAuthenticationSession for OAuth
        Task {
            do {
                _ = try await LinkedInService.shared.connectAnalytics(from: nil)
            } catch {
                print("❌ Failed to connect analytics: \(error)")
            }
            isConnectingAnalytics = false

            // Refresh analytics after connection
            await fetchAnalytics()
        }
    }

    func formatNumber(_ num: Int) -> String {
        if num >= 1000 {
            let thousands = Double(num) / 1000.0
            return String(format: "%.1fK", thousands)
        }
        return String(num)
    }

    func loadInsights() {
        Task {
            await fetchInsights()
        }
    }

    func fetchInsights() async {
        isLoadingInsights = true

        do {
            print("💡 Fetching AI insights...")

            let response: InsightsResponse = try await APIClient.shared.get(
                endpoint: "/api/analytics/insights",
                requiresAuth: true
            )

            await MainActor.run {
                self.insights = response.insights.map { insight in
                    InsightModel(
                        icon: insight.icon,
                        text: insight.text
                    )
                }
            }

            print("✅ Loaded \(response.insights.count) AI insights")
        } catch {
            print("❌ Failed to load insights: \(error)")
            // Show empty state on error (no hardcoded data)
            await MainActor.run {
                self.insights = [
                    InsightModel(
                        icon: "lightbulb.fill",
                        text: "Start publishing posts to unlock AI-powered insights"
                    )
                ]
            }
        }

        isLoadingInsights = false
    }

    /// Force sync analytics from LinkedIn API
    func syncAnalytics() async {
        isSyncing = true
        needsReauth = false

        do {
            print("🔄 Force syncing analytics from LinkedIn...")

            let response: SyncResponse = try await APIClient.shared.post(
                endpoint: "/api/analytics/sync",
                body: [:] as [String: String],
                requiresAuth: true
            )

            if response.success, let snapshot = response.snapshot {
                await MainActor.run {
                    self.visibilityScore = Double(snapshot.visibilityScore)
                    self.followerCount = snapshot.followerCount
                    self.connectionCount = snapshot.connectionCount
                    self.totalImpressions = snapshot.totalImpressions
                    self.engagementRate = snapshot.engagementRate

                    let formatter = ISO8601DateFormatter()
                    formatter.formatOptions = [.withFullDate]
                    self.lastUpdated = formatter.date(from: snapshot.snapshotDate)
                }
                print("✅ Analytics synced successfully")
            }
        } catch let error as APIError {
            print("❌ Failed to sync analytics: \(error)")

            if error.isScopeError {
                await MainActor.run {
                    self.needsReauth = true
                }
            }
        } catch {
            print("❌ Failed to sync analytics: \(error)")
        }

        isSyncing = false
    }

    // MARK: - Best Times to Post

    func loadBestTimes() {
        Task {
            await fetchBestTimes()
        }
    }

    func fetchBestTimes() async {
        isLoadingBestTimes = true

        do {
            print("🕐 Fetching best times to post...")

            let response: BestTimesResponse = try await APIClient.shared.get(
                endpoint: "/api/analytics/best-times",
                requiresAuth: true
            )

            await MainActor.run {
                self.bestTimesHeatmap = response.heatmap
                self.topPostingSlots = response.topSlots
                self.bestTimesDataSource = response.dataSource
            }

            print("✅ Best times loaded: \(response.topSlots.count) top slots, source=\(response.dataSource)")
        } catch {
            print("❌ Failed to load best times: \(error)")
            // Use empty state on error
            await MainActor.run {
                self.bestTimesHeatmap = []
                self.topPostingSlots = []
                self.bestTimesDataSource = "linkedin_defaults"
            }
        }

        isLoadingBestTimes = false
    }

    /// Fetch follower trends
    func fetchFollowerTrends() async {
        do {
            print("📈 Fetching follower trends...")

            let response: FollowerAnalyticsResponse = try await APIClient.shared.get(
                endpoint: "/api/analytics/followers",
                requiresAuth: true
            )

            await MainActor.run {
                self.followerCount = response.currentCount
                self.followerTrends = response.trends
            }

            print("✅ Follower trends loaded: \(response.trends.count) data points")
        } catch {
            print("❌ Failed to load follower trends: \(error)")
        }
    }

    func back() {
        NotificationCenter.default.post(name: .analyticsBack, object: nil)
    }

    func showCalendar() {
        NotificationCenter.default.post(name: .navigateToCalendar, object: nil)
    }

    /// Handle re-authentication requirement
    func handleReauth() {
        // Clear JWT and redirect to login
        do {
            try KeychainService.deleteJWT()
        } catch {
            print("❌ Failed to delete JWT: \(error)")
        }
        NotificationCenter.default.post(name: .forceLogout, object: nil)
    }
}

struct InsightModel: Identifiable {
    let id = UUID()
    let icon: String
    let text: String
}

extension Notification.Name {
    static let analyticsBack = Notification.Name("analyticsBack")
    static let navigateToCalendar = Notification.Name("navigateToCalendar")
    static let forceLogout = Notification.Name("forceLogout")
}
