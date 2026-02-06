//
//  KuilApp.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

@main
struct KuilApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var appState = AppState.shared
    @StateObject private var pushService = PushNotificationService.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .environmentObject(pushService)
                .preferredColorScheme(appState.colorScheme)
                .onAppear {
                    // Setup notification observers for navigation
                    setupNotificationObservers()
                }
        }
    }

    private func setupNotificationObservers() {
        // Handle navigation from notifications
        NotificationCenter.default.addObserver(
            forName: .navigateToPublishedPost,
            object: nil,
            queue: .main
        ) { notification in
            if let postId = notification.userInfo?["postId"] as? String {
                debugLog("[App] Navigate to published post: \(postId)")
            }
            AppState.shared.selectedTab = .home
        }

        NotificationCenter.default.addObserver(
            forName: .navigateToScheduledPosts,
            object: nil,
            queue: .main
        ) { _ in
            debugLog("[App] Navigate to scheduled posts")
            AppState.shared.selectedTab = .calendar
        }

        NotificationCenter.default.addObserver(
            forName: .navigateToAnalytics,
            object: nil,
            queue: .main
        ) { _ in
            debugLog("[App] Navigate to analytics")
            AppState.shared.selectedTab = .analytics
        }
    }
}
