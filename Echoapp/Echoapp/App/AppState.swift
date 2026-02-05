//
//  AppState.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

@MainActor
class AppState: ObservableObject {
    @Published var showSplash: Bool = true
    @Published var isAuthenticated: Bool = false
    @Published var hasCompletedOnboarding: Bool = false
    @Published var hasCompletedProfileSync: Bool = false  // LinkedIn profile URL sync for AI analysis
    @Published var hasCompletedToneCalibration: Bool = false
    @Published var hasSelectedTopics: Bool = false  // Topic interests selection (Reddit-style)
    @Published var hasSeenProfilescope: Bool = false  // Profile analysis result page
    @Published var hasCompletedATTRequest: Bool = false
    @Published var selectedTab: MainTab = .home
    @Published var navigationPath = NavigationPath()

    // User profile data
    @Published var userProfile: UserProfileResponse?
    @Published var userStats: UserStatsResponse?

    // Color scheme preference (stored in UserDefaults)
    @Published var colorScheme: ColorScheme?

    static let shared = AppState()

    private init() {
        // Load color scheme from UserDefaults
        loadColorScheme()
    }

    private func loadColorScheme() {
        if let savedScheme = UserDefaults.standard.string(forKey: "colorScheme") {
            switch savedScheme {
            case "light":
                colorScheme = .light
            case "dark":
                colorScheme = .dark
            default:
                colorScheme = nil // System
            }
        }
    }

    func setColorScheme(_ scheme: ColorScheme?) {
        colorScheme = scheme
        // Save to UserDefaults
        if let scheme = scheme {
            UserDefaults.standard.set(scheme == .light ? "light" : "dark", forKey: "colorScheme")
        } else {
            UserDefaults.standard.set("system", forKey: "colorScheme")
        }
    }

    /// Load user profile and stats after authentication
    func loadUserData() async {
        print("🔄 Loading user data...")

        do {
            // Fetch profile
            let profile = try await UserService.shared.fetchProfile()
            await MainActor.run {
                self.userProfile = profile
            }
            print("✅ User profile loaded: \(profile.name)")

            // Fetch stats
            let stats = try await UserService.shared.fetchStats()
            await MainActor.run {
                self.userStats = stats
            }
            print("✅ User stats loaded: visibility \(stats.visibilityScore)")

        } catch {
            print("❌ Failed to load user data: \(error)")
        }
    }

    /// Sign out user and reset app state
    func signOut() {
        print("👋 Signing out user...")

        // Reset all authentication state
        isAuthenticated = false
        hasCompletedOnboarding = false
        hasCompletedProfileSync = false
        hasCompletedToneCalibration = false
        hasSelectedTopics = false
        hasSeenProfilescope = false
        // Note: Don't reset hasCompletedATTRequest - ATT is a one-time system request

        // Clear user data
        userProfile = nil
        userStats = nil

        // Reset navigation
        selectedTab = .home
        navigationPath = NavigationPath()

        print("✅ User signed out successfully")
    }
}

enum MainTab: String, CaseIterable {
    case home = "Home"
    case calendar = "Calendar"
    case create = "Create"
    case analytics = "Analytics"
    case profile = "Profile"
    
    var icon: String {
        switch self {
        case .home: return "house.fill"
        case .calendar: return "calendar"
        case .create: return "plus.circle.fill"
        case .analytics: return "chart.line.uptrend.xyaxis"
        case .profile: return "person.fill"
        }
    }
}
