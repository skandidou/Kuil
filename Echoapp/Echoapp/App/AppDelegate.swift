//
//  AppDelegate.swift
//  Kuil
//
//  App lifecycle and push notification handling
//

import UIKit
import UserNotifications

class AppDelegate: NSObject, UIApplicationDelegate {

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // Configure push notification delegate
        UNUserNotificationCenter.current().delegate = PushNotificationService.shared

        // Check if app was launched from notification
        if let notificationPayload = launchOptions?[.remoteNotification] as? [AnyHashable: Any] {
            PushNotificationService.shared.handleNotification(userInfo: notificationPayload)
        }

        print("[AppDelegate] Application did finish launching")
        return true
    }

    // MARK: - Push Notifications

    /// Successfully registered for remote notifications
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        PushNotificationService.shared.didRegisterForRemoteNotifications(deviceToken: deviceToken)

        // Convert to string and use as FCM token (if not using Firebase SDK)
        let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        PushNotificationService.shared.updateFCMToken(tokenString)
    }

    /// Failed to register for remote notifications
    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("[AppDelegate] Failed to register for remote notifications: \(error)")
    }

    /// Received remote notification (background)
    func application(
        _ application: UIApplication,
        didReceiveRemoteNotification userInfo: [AnyHashable: Any],
        fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
    ) {
        PushNotificationService.shared.handleNotification(userInfo: userInfo)
        completionHandler(.newData)
    }
}
