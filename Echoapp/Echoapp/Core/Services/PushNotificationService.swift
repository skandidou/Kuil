//
//  PushNotificationService.swift
//  Kuil
//
//  Push notification management with Firebase Cloud Messaging
//

import Foundation
import UserNotifications
import UIKit

/// Service for managing push notifications
class PushNotificationService: NSObject, ObservableObject {
    static let shared = PushNotificationService()

    @Published var fcmToken: String?
    @Published var isAuthorized: Bool = false
    @Published var pendingNotification: NotificationPayload?

    private let apiClient = APIClient.shared

    private override init() {
        super.init()
    }

    // MARK: - Authorization

    /// Request notification permissions from user
    func requestAuthorization() async -> Bool {
        let center = UNUserNotificationCenter.current()

        do {
            let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
            await MainActor.run {
                self.isAuthorized = granted
            }

            if granted {
                await MainActor.run {
                    UIApplication.shared.registerForRemoteNotifications()
                }
                print("[Push] Notification permission granted")
            } else {
                print("[Push] Notification permission denied")
            }

            return granted
        } catch {
            print("[Push] Error requesting authorization: \(error)")
            return false
        }
    }

    /// Check current authorization status
    func checkAuthorizationStatus() async -> UNAuthorizationStatus {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        await MainActor.run {
            self.isAuthorized = settings.authorizationStatus == .authorized
        }
        return settings.authorizationStatus
    }

    // MARK: - Token Management

    /// Handle device token received from APNs
    func didRegisterForRemoteNotifications(deviceToken: Data) {
        // Convert token to string for FCM (if not using Firebase SDK directly)
        let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("[Push] APNs device token: \(tokenString.prefix(20))...")

        // If using Firebase SDK, Firebase will handle this automatically
        // Otherwise, send to your server for FCM registration
    }

    /// Update FCM token (called by Firebase SDK or manually)
    func updateFCMToken(_ token: String) {
        self.fcmToken = token
        print("[Push] FCM token updated: \(token.prefix(20))...")

        // Register with backend
        Task {
            await registerDeviceWithBackend(token: token)
        }
    }

    /// Register device token with backend
    private func registerDeviceWithBackend(token: String) async {
        do {
            let deviceInfo: [String: Any] = [
                "fcmToken": token,
                "platform": "ios",
                "osVersion": UIDevice.current.systemVersion,
                "appVersion": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
            ]

            let _: NotificationAPIResponse = try await apiClient.request(
                endpoint: "/api/notifications/register-device",
                method: "POST",
                body: deviceInfo
            )

            print("[Push] Device registered with backend")
        } catch {
            print("[Push] Failed to register device: \(error)")
        }
    }

    /// Unregister device from backend (on logout)
    func unregisterDevice() async {
        guard let token = fcmToken else { return }

        do {
            let _: NotificationAPIResponse = try await apiClient.request(
                endpoint: "/api/notifications/unregister-device",
                method: "DELETE",
                body: ["fcmToken": token]
            )

            await MainActor.run {
                self.fcmToken = nil
            }

            print("[Push] Device unregistered")
        } catch {
            print("[Push] Failed to unregister device: \(error)")
        }
    }

    // MARK: - Notification Handling

    /// Handle received notification (foreground)
    func handleNotification(userInfo: [AnyHashable: Any]) {
        print("[Push] Received notification: \(userInfo)")

        guard let payload = parseNotificationPayload(userInfo) else {
            return
        }

        // Update UI or navigate based on notification type
        DispatchQueue.main.async {
            self.pendingNotification = payload
        }
    }

    /// Handle notification tap (user opened app from notification)
    func handleNotificationResponse(_ response: UNNotificationResponse) {
        let userInfo = response.notification.request.content.userInfo
        print("[Push] Notification tapped: \(userInfo)")

        guard let payload = parseNotificationPayload(userInfo) else {
            return
        }

        // Navigate to appropriate screen based on action
        DispatchQueue.main.async {
            self.handleNotificationAction(payload)
        }
    }

    /// Parse notification payload
    private func parseNotificationPayload(_ userInfo: [AnyHashable: Any]) -> NotificationPayload? {
        guard let type = userInfo["type"] as? String else {
            return nil
        }

        return NotificationPayload(
            type: NotificationType(rawValue: type) ?? .unknown,
            action: userInfo["action"] as? String,
            postId: userInfo["postId"] as? String,
            title: userInfo["aps"] as? [String: Any],
            body: nil
        )
    }

    /// Handle notification action (navigate to appropriate screen)
    private func handleNotificationAction(_ payload: NotificationPayload) {
        switch payload.type {
        case .postPublished:
            // Navigate to post details or LinkedIn
            NotificationCenter.default.post(
                name: .navigateToPublishedPost,
                object: nil,
                userInfo: ["postId": payload.postId ?? ""]
            )

        case .postFailed:
            // Navigate to scheduled posts to retry
            NotificationCenter.default.post(
                name: .navigateToScheduledPosts,
                object: nil
            )

        case .scheduledReminder:
            // Navigate to scheduled posts
            NotificationCenter.default.post(
                name: .navigateToScheduledPosts,
                object: nil
            )

        case .tokenExpiring:
            // Navigate to settings to reconnect LinkedIn
            NotificationCenter.default.post(
                name: .navigateToLinkedInReconnect,
                object: nil
            )

        case .weeklySummary:
            // Navigate to analytics
            NotificationCenter.default.post(
                name: .navigateToAnalytics,
                object: nil
            )

        case .unknown:
            break
        }

        // Clear pending notification
        pendingNotification = nil
    }

    // MARK: - Preferences

    /// Get notification preferences from backend
    func getPreferences() async throws -> NotificationPreferences {
        return try await apiClient.request(
            endpoint: "/api/notifications/preferences",
            method: "GET"
        )
    }

    /// Update notification preferences
    func updatePreferences(_ preferences: NotificationPreferences) async throws {
        let _: NotificationAPIResponse = try await apiClient.request(
            endpoint: "/api/notifications/preferences",
            method: "PUT",
            body: ["preferences": preferences.toDictionary()]
        )
    }

    /// Clear badge count
    func clearBadge() {
        Task {
            do {
                try await UNUserNotificationCenter.current().setBadgeCount(0)
            } catch {
                print("[Push] Failed to clear badge: \(error)")
            }
        }
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension PushNotificationService: UNUserNotificationCenterDelegate {
    /// Handle notification when app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        handleNotification(userInfo: notification.request.content.userInfo)

        // Show banner even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }

    /// Handle notification tap
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        handleNotificationResponse(response)
        completionHandler()
    }
}

// MARK: - Models

struct NotificationPayload {
    let type: NotificationType
    let action: String?
    let postId: String?
    let title: [String: Any]?
    let body: String?
}

enum NotificationType: String {
    case postPublished = "post_published"
    case postFailed = "post_failed"
    case scheduledReminder = "post_scheduled_reminder"
    case tokenExpiring = "linkedin_token_expiring"
    case weeklySummary = "weekly_summary"
    case unknown
}

struct NotificationPreferences: Codable {
    var postPublished: Bool
    var postFailed: Bool
    var scheduledReminder: Bool
    var tokenExpiring: Bool
    var weeklySummary: Bool

    enum CodingKeys: String, CodingKey {
        case postPublished = "post_published"
        case postFailed = "post_failed"
        case scheduledReminder = "scheduled_reminder"
        case tokenExpiring = "token_expiring"
        case weeklySummary = "weekly_summary"
    }

    func toDictionary() -> [String: Bool] {
        return [
            "post_published": postPublished,
            "post_failed": postFailed,
            "scheduled_reminder": scheduledReminder,
            "token_expiring": tokenExpiring,
            "weekly_summary": weeklySummary
        ]
    }
}

/// API response for notification endpoints
struct NotificationAPIResponse: Codable {
    let success: Bool?
    let message: String?
}

// MARK: - Notification Names

extension Notification.Name {
    static let navigateToPublishedPost = Notification.Name("navigateToPublishedPost")
    static let navigateToScheduledPosts = Notification.Name("navigateToScheduledPosts")
    static let navigateToLinkedInReconnect = Notification.Name("navigateToLinkedInReconnect")
    static let navigateToAnalytics = Notification.Name("navigateToAnalytics")
}
