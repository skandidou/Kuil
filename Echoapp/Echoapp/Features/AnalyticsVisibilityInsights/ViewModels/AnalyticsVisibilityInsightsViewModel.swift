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
    let visibilityScore: Double
    let scoreChange: Double
    let topPosts: [TopPostData]
}

struct TopPostData: Codable {
    let id: String
    let title: String
    let likes: Int
    let comments: Int
    let postedAt: String
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
    @Published var visibilityScore: Double = 0.0
    @Published var scoreChange: Double = 0.0
    @Published var topPosts: [TopPostModel] = []
    @Published var insights: [InsightModel] = []
    @Published var isLoading: Bool = false
    @Published var isLoadingInsights: Bool = false

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
    }

    func loadAnalytics() {
        Task {
            await fetchAnalytics()
        }
    }

    func fetchAnalytics() async {
        isLoading = true

        do {
            print("📊 Fetching analytics data...")

            // Call backend to get analytics
            let response: AnalyticsResponse = try await APIClient.shared.get(
                endpoint: "/api/analytics",
                requiresAuth: true
            )

            await MainActor.run {
                self.visibilityScore = response.visibilityScore
                self.scoreChange = response.scoreChange

                self.topPosts = response.topPosts.map { post in
                    TopPostModel(
                        title: post.title,
                        likes: formatNumber(post.likes),
                        comments: String(post.comments)
                    )
                }

                // If no posts, show empty state
                if self.topPosts.isEmpty {
                    self.topPosts = []
                }
            }

            print("✅ Analytics loaded: visibility \(response.visibilityScore), \(response.topPosts.count) top posts")
        } catch {
            print("❌ Failed to load analytics: \(error)")
            // Show zeros on error
            await MainActor.run {
                self.visibilityScore = 0.0
                self.scoreChange = 0.0
                self.topPosts = []
            }
        }

        isLoading = false
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

    func back() {
        NotificationCenter.default.post(name: .analyticsBack, object: nil)
    }

    func showCalendar() {
        NotificationCenter.default.post(name: .navigateToCalendar, object: nil)
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
}
