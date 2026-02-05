//
//  ContentCalendarSchedulingViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

// MARK: - API Response Models

struct ScheduledPostsResponse: Codable {
    let posts: [ScheduledPost]
}

struct ScheduledPost: Codable {
    let id: String
    let content: String
    let scheduledAt: String?  // Can be null for published posts without schedule
    let status: String
    let linkedinProfile: Bool
    let likes: Int
    let comments: Int
}

@MainActor
class ContentCalendarSchedulingViewModel: ObservableObject {
    @Published var days: [DayModel] = []
    @Published var selectedDay: DayModel?
    @Published var timelineItems: [TimelineItemModel] = []

    // Optimal time suggestion
    @Published var showOptimalTimeAlert: Bool = false
    @Published var optimalTimeSuggestion: String = ""
    @Published var optimalTimeReason: String = ""
    @Published var isLoadingOptimalTime: Bool = false

    // Edit post
    @Published var showEditSheet: Bool = false
    @Published var editingPostId: String = ""
    @Published var editingContent: String = ""
    @Published var editingScheduledDate: Date = Date()

    // Delete post
    @Published var showDeleteConfirmation: Bool = false
    @Published var deletingPostId: String = ""

    // Multi-select deletion
    @Published var isSelectionMode: Bool = false
    @Published var selectedPostIds: Set<String> = []
    @Published var showBulkDeleteConfirmation: Bool = false

    // Computed property to check if there are deletable posts
    var hasDeletablePosts: Bool {
        timelineItems.contains { $0.status == "scheduled" || $0.status == "failed" }
    }

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
        loadDays()
        loadTimeline()

        // Refresh calendar when a post is scheduled
        NotificationCenter.default.publisher(for: .editorScheduled)
            .sink { [weak self] _ in
                self?.loadTimeline()
            }
            .store(in: &cancellables)
    }

    func loadDays() {
        let calendar = Calendar.current
        let today = Date()

        days = (0..<7).compactMap { offset in
            guard let date = calendar.date(byAdding: .day, value: offset, to: today) else { return nil }
            let formatter = DateFormatter()
            formatter.dateFormat = "EEE"
            let dayName = formatter.string(from: date).uppercased()

            formatter.dateFormat = "d"
            let dayNumber = formatter.string(from: date)

            return DayModel(
                dayName: String(dayName.prefix(3)),
                dayNumber: dayNumber,
                date: date,
                hasEvents: false  // Will be updated from backend
            )
        }

        selectedDay = days.first { calendar.isDateInToday($0.date) } ?? days.first
    }

    func loadTimeline() {
        // Load real scheduled posts from backend
        Task {
            await fetchScheduledPosts()
        }
    }

    func fetchScheduledPosts() async {
        do {
            print("📅 Fetching scheduled posts...")

            // Call backend to get scheduled posts
            let response: ScheduledPostsResponse = try await APIClient.shared.get(
                endpoint: "/api/posts/scheduled",
                requiresAuth: true
            )

            await MainActor.run {
                // Filter posts by selected date
                let calendar = Calendar.current
                let selectedDate = self.selectedDay?.date ?? Date()

                let filteredPosts = response.posts.filter { post in
                    // Skip posts without scheduledAt (e.g., published posts)
                    guard let scheduledAt = post.scheduledAt,
                          let postDate = self.parseISODate(scheduledAt) else {
                        return false
                    }
                    return calendar.isDate(postDate, inSameDayAs: selectedDate)
                }

                // Update hasEvents for days
                self.updateDaysWithEvents(posts: response.posts)

                // Convert API response to timeline items
                self.timelineItems = filteredPosts.map { post in
                    TimelineItemModel(
                        id: post.id,
                        time: post.scheduledAt != nil ? self.formatTime(post.scheduledAt!) : "Now",
                        title: post.content,
                        subtitle: post.linkedinProfile ? "Linked to personal profile" : nil,
                        badge: self.getBadgeText(post.status),
                        status: post.status,
                        statusColor: self.getStatusColor(post.status),
                        engagement: post.status == "published" ? (String(post.likes), String(post.comments)) : nil,
                        scheduledAt: post.scheduledAt
                    )
                }

                print("✅ Loaded \(response.posts.count) total posts, \(filteredPosts.count) match selected day (\(selectedDate))")

                // If no posts for this day, show proper empty state (no fake data)
                if self.timelineItems.isEmpty {
                    self.timelineItems = [
                        TimelineItemModel(
                            id: "empty",
                            time: "",
                            title: "No posts for this day",
                            subtitle: "Tap + to create a new post",
                            badge: nil,
                            status: "empty",
                            statusColor: .tertiaryText,
                            engagement: nil,
                            scheduledAt: nil
                        )
                    ]
                }
            }
        } catch {
            print("❌ Failed to load scheduled posts: \(error)")
            // Show proper empty state on error (no fake data)
            await MainActor.run {
                self.timelineItems = [
                    TimelineItemModel(
                        id: "error",
                        time: "",
                        title: "Failed to load posts",
                        subtitle: "Pull down to refresh",
                        badge: nil,
                        status: "error",
                        statusColor: .tertiaryText,
                        engagement: nil,
                        scheduledAt: nil
                    )
                ]
            }
        }
    }

    private func updateDaysWithEvents(posts: [ScheduledPost]) {
        let calendar = Calendar.current

        for i in 0..<days.count {
            let dayDate = days[i].date
            let hasEvent = posts.contains { post in
                guard let scheduledAt = post.scheduledAt,
                      let postDate = parseISODate(scheduledAt) else {
                    return false
                }
                return calendar.isDate(postDate, inSameDayAs: dayDate)
            }

            days[i] = DayModel(
                dayName: days[i].dayName,
                dayNumber: days[i].dayNumber,
                date: days[i].date,
                hasEvents: hasEvent
            )
        }
    }

    func formatTime(_ isoString: String) -> String {
        guard let date = parseISODate(isoString) else { return "12:00 PM" }

        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "h:mm a"
        return timeFormatter.string(from: date)
    }

    func getStatusColor(_ status: String) -> Color {
        switch status.lowercased() {
        case "scheduled": return .appPrimary
        case "draft": return .tertiaryText
        case "published": return .successGreen
        case "failed": return .errorRed
        default: return .tertiaryText
        }
    }

    func getBadgeText(_ status: String) -> String {
        switch status.lowercased() {
        case "published": return "SUCCESS"
        case "failed": return "FAILED"
        default: return status.uppercased()
        }
    }

    // MARK: - Edit Post

    func editPost(_ item: TimelineItemModel) {
        editingPostId = item.id
        editingContent = item.title
        if let scheduledAt = item.scheduledAt, let date = parseISODate(scheduledAt) {
            editingScheduledDate = date
        } else {
            editingScheduledDate = Date()
        }
        showEditSheet = true
    }

    func saveEditedPost() {
        Task {
            await updatePost()
        }
    }

    func updatePost() async {
        do {
            print("✏️ Updating post \(editingPostId)...")

            struct UpdateResponse: Codable {
                let success: Bool
            }

            let isoFormatter = ISO8601DateFormatter()
            let scheduledAtISO = isoFormatter.string(from: editingScheduledDate)

            let _: UpdateResponse = try await APIClient.shared.put(
                endpoint: "/api/posts/\(editingPostId)",
                body: [
                    "content": editingContent,
                    "scheduledAt": scheduledAtISO
                ]
            )

            print("✅ Post updated successfully")

            await MainActor.run {
                self.showEditSheet = false
                self.loadTimeline()
            }
        } catch {
            print("❌ Failed to update post: \(error)")
        }
    }

    // MARK: - Delete Post

    func confirmDeletePost(_ item: TimelineItemModel) {
        deletingPostId = item.id
        showDeleteConfirmation = true
    }

    func deletePost() {
        Task {
            await performDeletePost()
        }
    }

    func performDeletePost() async {
        do {
            print("🗑️ Deleting post \(deletingPostId)...")

            struct DeleteResponse: Codable {
                let success: Bool
            }

            let _: DeleteResponse = try await APIClient.shared.delete(
                endpoint: "/api/posts/\(deletingPostId)"
            )

            print("✅ Post deleted successfully")

            await MainActor.run {
                self.showDeleteConfirmation = false
                self.loadTimeline()
                // Notify Activity Center to refresh
                NotificationCenter.default.post(name: .postsDeleted, object: nil)
            }
        } catch {
            print("❌ Failed to delete post: \(error)")
        }
    }

    // MARK: - Multi-Select Deletion

    func enterSelectionMode() {
        isSelectionMode = true
        selectedPostIds = []
    }

    func exitSelectionMode() {
        isSelectionMode = false
        selectedPostIds = []
    }

    func toggleSelection(_ item: TimelineItemModel) {
        if selectedPostIds.contains(item.id) {
            selectedPostIds.remove(item.id)
        } else {
            selectedPostIds.insert(item.id)
        }
    }

    func confirmBulkDelete() {
        guard !selectedPostIds.isEmpty else { return }
        showBulkDeleteConfirmation = true
    }

    func performBulkDelete() {
        Task {
            await executeBulkDelete()
        }
    }

    func executeBulkDelete() async {
        do {
            let postIds = Array(selectedPostIds)
            print("🗑️ Bulk deleting \(postIds.count) posts...")

            struct BulkDeleteResponse: Codable {
                let success: Bool
                let deletedCount: Int
            }

            let response: BulkDeleteResponse = try await APIClient.shared.post(
                endpoint: "/api/posts/bulk-delete",
                body: ["postIds": postIds]
            )

            print("✅ Bulk delete successful: \(response.deletedCount) posts deleted")

            await MainActor.run {
                self.showBulkDeleteConfirmation = false
                self.exitSelectionMode()
                self.loadTimeline()
                // Notify Activity Center to refresh
                NotificationCenter.default.post(name: .postsDeleted, object: nil)
            }
        } catch {
            print("❌ Failed to bulk delete posts: \(error)")
            await MainActor.run {
                self.showBulkDeleteConfirmation = false
            }
        }
    }

    func selectDay(_ day: DayModel) {
        selectedDay = day
        loadTimeline()
    }

    func createNew() {
        // Navigate to create content tab
        AppState.shared.selectedTab = .create
    }

    func suggestOptimalTime() {
        // Call AI to suggest optimal posting time
        Task {
            await fetchOptimalTime()
        }
    }

    func fetchOptimalTime() async {
        await MainActor.run {
            isLoadingOptimalTime = true
        }

        do {
            print("🤖 Fetching optimal posting time...")

            struct OptimalTimeResponse: Codable {
                let suggestedTime: String
                let reason: String
            }

            let response: OptimalTimeResponse = try await APIClient.shared.get(
                endpoint: "/api/posts/optimal-time",
                requiresAuth: true
            )

            print("✅ Optimal time: \(response.suggestedTime) - \(response.reason)")

            await MainActor.run {
                self.optimalTimeSuggestion = response.suggestedTime
                self.optimalTimeReason = response.reason
                self.showOptimalTimeAlert = true
                self.isLoadingOptimalTime = false
            }
        } catch {
            print("❌ Failed to fetch optimal time: \(error)")
            await MainActor.run {
                self.optimalTimeSuggestion = "12:00 PM"
                self.optimalTimeReason = "Based on general LinkedIn engagement patterns"
                self.showOptimalTimeAlert = true
                self.isLoadingOptimalTime = false
            }
        }
    }
}

extension Notification.Name {
    static let navigateToCreateContent = Notification.Name("navigateToCreateContent")
    static let showOptimalTimeSuggestion = Notification.Name("showOptimalTimeSuggestion")
    static let postsDeleted = Notification.Name("postsDeleted")
}
