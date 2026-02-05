//
//  NotificationEngagementCenterViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

// MARK: - API Response Models

struct UserActivityResponse: Codable {
    let activities: [ActivityItem]
}

struct ActivityItem: Codable {
    let type: String
    let title: String
    let description: String
    let timestamp: String
    let icon: String
    let iconColor: String
    let actionable: Bool?
    let isHighlighted: Bool?
}

@MainActor
class NotificationEngagementCenterViewModel: ObservableObject {
    @Published var recentNotifications: [NotificationModel] = []
    @Published var scheduledNotifications: [NotificationModel] = []
    @Published var earlierNotifications: [NotificationModel] = []
    @Published var isLoading: Bool = false

    private var cancellables = Set<AnyCancellable>()

    // ISO8601 formatter that handles fractional seconds from backend
    private let isoFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    // Fallback formatter without fractional seconds
    private let isoFormatterNoFraction: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    private func parseISODate(_ string: String) -> Date? {
        // Try with fractional seconds first (backend format: 2026-01-26T08:00:00.000Z)
        if let date = isoFormatter.date(from: string) {
            return date
        }
        // Fallback to without fractional seconds
        return isoFormatterNoFraction.date(from: string)
    }

    init() {
        loadNotifications()

        // Listen for posts deleted notification to refresh
        NotificationCenter.default.publisher(for: .postsDeleted)
            .sink { [weak self] _ in
                self?.loadNotifications()
            }
            .store(in: &cancellables)
    }

    func loadNotifications() {
        Task {
            await fetchActivities()
        }
    }

    func fetchActivities() async {
        isLoading = true

        do {
            print("📋 Fetching user activities...")

            let response: UserActivityResponse = try await APIClient.shared.get(
                endpoint: "/api/user/activity",
                requiresAuth: true
            )

            await MainActor.run {
                // Separate activities by type and recency
                var recent: [NotificationModel] = []
                var scheduled: [NotificationModel] = []
                var earlier: [NotificationModel] = []

                let now = Date()
                let oneDayAgo = now.addingTimeInterval(-86400) // 24 hours

                for activity in response.activities {
                    let timestamp = self.parseISODate(activity.timestamp) ?? now
                    let isRecent = timestamp > oneDayAgo

                    let notification = NotificationModel(
                        icon: activity.icon,
                        iconColor: self.parseColor(activity.iconColor),
                        title: activity.title,
                        description: activity.description,
                        timestamp: self.formatTimestamp(timestamp),
                        actionTitle: activity.actionable == true ? "View" : nil,
                        action: activity.actionable == true ? {} : nil,
                        isNew: isRecent,
                        isHighlighted: activity.isHighlighted ?? false
                    )

                    // Categorize by type
                    if activity.type == "scheduled_reminder" {
                        scheduled.append(notification)
                    } else if isRecent {
                        recent.append(notification)
                    } else {
                        earlier.append(notification)
                    }
                }

                self.recentNotifications = recent
                self.scheduledNotifications = scheduled
                self.earlierNotifications = earlier
            }

            print("✅ Loaded \(response.activities.count) activity items")
        } catch {
            print("❌ Failed to load activities: \(error)")
            // Show empty state on error (no hardcoded data)
            await MainActor.run {
                self.recentNotifications = []
                self.scheduledNotifications = []
                self.earlierNotifications = []
            }
        }

        isLoading = false
    }

    private func parseColor(_ colorName: String) -> Color {
        switch colorName.lowercased() {
        case "appprimary":
            return .appPrimary
        case "successgreen":
            return .successGreen
        case "orange":
            return .orange
        case "errored":
            return .errorRed
        default:
            return .secondaryText
        }
    }

    private func formatTimestamp(_ date: Date) -> String {
        let now = Date()
        let interval = now.timeIntervalSince(date)

        // Future date (scheduled posts)
        if interval < 0 {
            let futureInterval = abs(interval)
            if futureInterval < 3600 {
                let minutes = Int(futureInterval / 60)
                return "in \(minutes)m"
            } else if futureInterval < 86400 {
                let hours = Int(futureInterval / 3600)
                return "in \(hours)h"
            } else {
                let days = Int(futureInterval / 86400)
                return "in \(days)d"
            }
        }

        // Past date
        if interval < 60 {
            return "just now"
        } else if interval < 3600 {
            let minutes = Int(interval / 60)
            return "\(minutes)m ago"
        } else if interval < 86400 {
            let hours = Int(interval / 3600)
            return "\(hours)h ago"
        } else {
            let days = Int(interval / 86400)
            return "\(days)d ago"
        }
    }
    
    func back() {
        NotificationCenter.default.post(name: .notificationsBack, object: nil)
    }
    
    func showSettings() {
        // Handle settings
    }
}

extension Notification.Name {
    static let notificationsBack = Notification.Name("notificationsBack")
}
