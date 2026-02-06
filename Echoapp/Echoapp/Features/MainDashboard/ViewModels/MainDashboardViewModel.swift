//
//  MainDashboardViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

struct InspirationCardModel: Identifiable {
    let id = UUID()
    let badge: String
    let badgeColor: Color
    let title: String
    let subtitle: String
    let imageIcon: String
    let imageUrl: String?
}

struct ScheduledItemModel: Identifiable {
    let id = UUID()
    let platform: String
    let title: String
    let schedule: String
}

struct SuccessPatternModel: Identifiable {
    let id = UUID()
    let type: String
    let value: String
    let successRate: Int // 0-100
}

struct QuickStatsModel {
    let totalPosts: Int
    let publishedPosts: Int
    let averageHookScore: Int
}

struct BestTimeModel {
    let dayName: String
    let hourFormatted: String
    let score: Int
}

@MainActor
class MainDashboardViewModel: ObservableObject {
    @Published var userName: String = "Loading..."
    @Published var userTitle: String = "Professional"
    @Published var userRole: String = "Professional"
    @Published var roleColor: Color = .appPrimary
    @Published var visibilityScore: Int = 0
    @Published var scoreChange: Double?
    @Published var hasUnreadNotifications: Bool = true
    @Published var inspirationCards: [InspirationCardModel] = []
    @Published var nextScheduledItem: ScheduledItemModel?
    @Published var successPatterns: [SuccessPatternModel] = []
    @Published var quickStats: QuickStatsModel?
    @Published var bestTime: BestTimeModel?

    private var cancellables = Set<AnyCancellable>()

    init() {
        // Subscribe to AppState for real user data
        AppState.shared.$userProfile
            .compactMap { $0 }
            .sink { [weak self] profile in
                self?.userName = profile.name.components(separatedBy: " ").first ?? profile.name

                // Use the role selected during onboarding if available
                if let role = profile.role, !role.isEmpty {
                    self?.userRole = role
                    self?.userTitle = role
                    self?.roleColor = self?.colorForRole(role) ?? .appPrimary
                } else if let headline = profile.headline, !headline.isEmpty {
                    // Fallback to headline
                    let title = headline.components(separatedBy: " at ").first ?? headline
                    let cleanTitle = title.components(separatedBy: " | ").first ?? title
                    self?.userTitle = cleanTitle.trimmingCharacters(in: .whitespaces)
                    self?.userRole = cleanTitle.trimmingCharacters(in: .whitespaces)
                } else {
                    self?.userTitle = "LinkedIn Professional"
                    self?.userRole = "Professional"
                }
            }
            .store(in: &cancellables)

        // NOTE: visibilityScore is loaded from /api/analytics (loadScoreChange),
        // NOT from userStats which uses /api/user/stats (unreliable due to LinkedIn rate limits).
        // We only use userStats for quickStats (totalPosts, publishedPosts, averageHookScore).

        loadData()
    }

    func loadData() {
        // Load real next scheduled post (no hardcoded data)
        Task {
            await loadNextScheduledPost()
        }

        // Load real stats if not already loaded
        if AppState.shared.userStats == nil {
            Task {
                do {
                    let stats = try await UserService.shared.fetchStats()
                    await MainActor.run {
                        AppState.shared.userStats = stats
                        self.quickStats = QuickStatsModel(
                            totalPosts: stats.totalPosts,
                            publishedPosts: stats.publishedPosts,
                            averageHookScore: stats.averageHookScore
                        )
                    }
                } catch {
                    debugLog("Failed to load stats: \(error)")
                }
            }
        } else if let stats = AppState.shared.userStats {
            self.quickStats = QuickStatsModel(
                totalPosts: stats.totalPosts,
                publishedPosts: stats.publishedPosts,
                averageHookScore: stats.averageHookScore
            )
        }

        // Load AI-generated daily inspirations
        Task {
            await loadDailyInspirations()
        }

        // Load success patterns
        Task {
            await loadSuccessPatterns()
        }

        // Load best posting time
        Task {
            await loadBestTime()
        }

        // Load real score change from analytics
        Task {
            await loadScoreChange()
        }
    }

    func loadSuccessPatterns() async {
        do {
            struct PatternsResponse: Codable {
                let patterns: [PatternData]
            }
            struct PatternData: Codable {
                let type: String
                let value: String
                let successRate: Double
            }

            let response: PatternsResponse = try await APIClient.shared.get(
                endpoint: "/api/voice/success-patterns",
                requiresAuth: true
            )

            await MainActor.run {
                self.successPatterns = response.patterns.prefix(3).map { pattern in
                    SuccessPatternModel(
                        type: pattern.type,
                        value: pattern.value,
                        successRate: Int(pattern.successRate * 100)
                    )
                }
            }
        } catch {
            debugLog("Failed to load success patterns: \(error)")
        }
    }

    func loadBestTime() async {
        do {
            struct BestTimesResponse: Codable {
                let topSlots: [TopSlot]?
            }
            struct TopSlot: Codable {
                let dayName: String
                let hourFormatted: String
                let score: Int
            }

            let response: BestTimesResponse = try await APIClient.shared.get(
                endpoint: "/api/analytics/best-times",
                requiresAuth: true
            )

            if let topSlot = response.topSlots?.first {
                await MainActor.run {
                    self.bestTime = BestTimeModel(
                        dayName: topSlot.dayName,
                        hourFormatted: topSlot.hourFormatted,
                        score: topSlot.score
                    )
                }
            }
        } catch {
            debugLog("Failed to load best time: \(error)")
        }
    }

    func loadScoreChange() async {
        do {
            struct AnalyticsResponse: Codable {
                let visibilityScore: Int?
                let scoreChange: Double?
                let analyticsConnected: Bool?
            }

            let response: AnalyticsResponse = try await APIClient.shared.get(
                endpoint: "/api/analytics",
                requiresAuth: true
            )

            await MainActor.run {
                // Use analytics visibility score as primary source (more accurate than /api/user/stats)
                if let analyticsScore = response.visibilityScore, analyticsScore > 0 {
                    self.visibilityScore = analyticsScore
                }
                if let change = response.scoreChange {
                    self.scoreChange = change
                }
            }
        } catch {
            debugLog("Failed to load score change: \(error)")
        }
    }

    /// Load next scheduled post from backend
    func loadNextScheduledPost() async {
        do {
            debugLog("📅 Loading next scheduled post...")

            struct ScheduledPostsResponse: Codable {
                let posts: [ScheduledPostItem]
            }

            struct ScheduledPostItem: Codable {
                let id: String
                let content: String
                let scheduledAt: String?  // Can be null for published posts without schedule
                let status: String
            }

            let response: ScheduledPostsResponse = try await APIClient.shared.get(
                endpoint: "/api/posts/scheduled",
                requiresAuth: true
            )

            await MainActor.run {
                // Get next upcoming scheduled post (not published) - must have a scheduledAt date
                if let nextPost = response.posts.first(where: { $0.status == "scheduled" && $0.scheduledAt != nil }) {
                    // Truncate content to ~25 chars for display
                    let truncatedTitle = String(nextPost.content.prefix(25)) + (nextPost.content.count > 25 ? "..." : "")

                    self.nextScheduledItem = ScheduledItemModel(
                        platform: "LINKEDIN SCHEDULE",
                        title: truncatedTitle,
                        schedule: formatScheduleDate(nextPost.scheduledAt!)
                    )
                    debugLog("✅ Next scheduled post loaded: \(truncatedTitle)")
                } else {
                    // No scheduled posts - set to nil (UI should handle this)
                    self.nextScheduledItem = nil
                    debugLog("ℹ️ No scheduled posts found")
                }
            }
        } catch {
            debugLog("❌ Failed to load next scheduled post: \(error)")
            await MainActor.run {
                self.nextScheduledItem = nil
            }
        }
    }

    /// Format ISO date to user-friendly schedule string
    func formatScheduleDate(_ isoString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        // Try with fractional seconds first, then without
        var date = formatter.date(from: isoString)
        if date == nil {
            formatter.formatOptions = [.withInternetDateTime]
            date = formatter.date(from: isoString)
        }

        guard let scheduleDate = date else { return "Scheduled" }

        let calendar = Calendar.current
        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "h:mm a"

        if calendar.isDateInToday(scheduleDate) {
            return "Today @ \(timeFormatter.string(from: scheduleDate))"
        } else if calendar.isDateInTomorrow(scheduleDate) {
            return "Tomorrow @ \(timeFormatter.string(from: scheduleDate))"
        } else {
            let dayFormatter = DateFormatter()
            dayFormatter.dateFormat = "EEE @ h:mm a"
            return dayFormatter.string(from: scheduleDate)
        }
    }

    func loadDailyInspirations() async {
        do {
            debugLog("💡 Loading daily inspirations...")

            struct DailyInspirationsResponse: Codable {
                let inspirations: [InspirationData]
            }

            struct InspirationData: Codable {
                let badge: String
                let title: String
                let subtitle: String
                let imageUrl: String?
            }

            let response: DailyInspirationsResponse = try await APIClient.shared.get(
                endpoint: "/api/voice/daily-inspirations",
                requiresAuth: true
            )

            await MainActor.run {
                self.inspirationCards = response.inspirations.map { inspiration in
                    InspirationCardModel(
                        badge: inspiration.badge,
                        badgeColor: badgeColor(for: inspiration.badge),
                        title: inspiration.title,
                        subtitle: inspiration.subtitle,
                        imageIcon: badgeIcon(for: inspiration.badge),
                        imageUrl: inspiration.imageUrl
                    )
                }
            }

            debugLog("✅ Loaded \(response.inspirations.count) daily inspirations")
        } catch {
            debugLog("❌ Failed to load inspirations: \(error)")
            // Fallback to default inspirations
            let dayOfYear = Calendar.current.ordinality(of: .day, in: .year, for: Date()) ?? 1
            inspirationCards = [
                InspirationCardModel(
                    badge: "TRENDING",
                    badgeColor: .appPrimary,
                    title: "What top founders are saying about 2026",
                    subtitle: "Based on recent CEO interviews",
                    imageIcon: "chart.line.uptrend.xyaxis",
                    imageUrl: nil
                )
            ]
        }
    }

    func badgeColor(for badge: String) -> Color {
        switch badge.uppercased() {
        case "AI NEWS", "TECH TREND":
            return .appPrimary
        case "BUSINESS", "LEADERSHIP":
            return .accentCyan
        case "STARTUP":
            return .successGreen
        case "CAREER":
            return .orange
        default:
            return .accentLightBlue
        }
    }

    func badgeIcon(for badge: String) -> String {
        switch badge.uppercased() {
        case "AI NEWS", "TECH TREND":
            return "cpu"
        case "BUSINESS":
            return "chart.bar.fill"
        case "LEADERSHIP":
            return "person.3.fill"
        case "STARTUP":
            return "rocket.fill"
        case "CAREER":
            return "briefcase.fill"
        default:
            return "sparkles"
        }
    }
    
    func search() {
        // Handle search
    }

    func openNotifications() {
        // Handle notifications
    }

    /// Returns the accent color for a given user role
    func colorForRole(_ role: String) -> Color {
        switch role.lowercased() {
        case "founder":
            return .appPrimary // Blue
        case "job seeker":
            return Color(red: 0.8, green: 0.2, blue: 0.4) // Pink/Magenta
        case "creator":
            return .orange
        case "freelancer":
            return .mint
        case "executive":
            return Color(red: 0.4, green: 0.4, blue: 0.9) // Indigo
        default:
            return .appPrimary
        }
    }
}
