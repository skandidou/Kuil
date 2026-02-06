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
    @Published var selectedTopics: [String] = []

    // Centralized success patterns cache (prevents 7+ duplicate API calls)
    @Published var successPatterns: [String: Double] = [:]
    private var successPatternsLastFetched: Date?

    // Color scheme preference (stored in UserDefaults)
    @Published var colorScheme: ColorScheme?

    static let shared = AppState()

    // UserDefaults keys for onboarding persistence
    private enum Keys {
        static let isAuthenticated = "onboarding_isAuthenticated"
        static let hasCompletedOnboarding = "onboarding_hasCompletedOnboarding"
        static let hasCompletedToneCalibration = "onboarding_hasCompletedToneCalibration"
        static let hasSelectedTopics = "onboarding_hasSelectedTopics"
        static let hasSeenProfilescope = "onboarding_hasSeenProfilescope"
    }

    private init() {
        // Load color scheme from UserDefaults
        loadColorScheme()
        // Restore onboarding state from UserDefaults
        restoreOnboardingState()
    }

    /// Restore onboarding flags from UserDefaults (fast, synchronous)
    private func restoreOnboardingState() {
        let defaults = UserDefaults.standard

        // Only restore if we have a JWT (user was authenticated before)
        guard KeychainService.hasJWT() else {
            debugLog("🔑 No JWT found, starting fresh onboarding")
            return
        }

        isAuthenticated = defaults.bool(forKey: Keys.isAuthenticated)
        hasCompletedOnboarding = defaults.bool(forKey: Keys.hasCompletedOnboarding)
        hasCompletedToneCalibration = defaults.bool(forKey: Keys.hasCompletedToneCalibration)
        hasSelectedTopics = defaults.bool(forKey: Keys.hasSelectedTopics)
        hasSeenProfilescope = defaults.bool(forKey: Keys.hasSeenProfilescope)

        if hasCompletedOnboarding {
            debugLog("✅ Onboarding state restored from UserDefaults — skipping setup")
            // Also reload user data in background
            Task { await loadUserData() }
        } else if isAuthenticated {
            debugLog("🔄 Partial onboarding state restored — resuming from where user left off")
        }
    }

    /// Persist all onboarding flags to UserDefaults
    func saveOnboardingProgress() {
        let defaults = UserDefaults.standard
        defaults.set(isAuthenticated, forKey: Keys.isAuthenticated)
        defaults.set(hasCompletedOnboarding, forKey: Keys.hasCompletedOnboarding)
        defaults.set(hasCompletedToneCalibration, forKey: Keys.hasCompletedToneCalibration)
        defaults.set(hasSelectedTopics, forKey: Keys.hasSelectedTopics)
        defaults.set(hasSeenProfilescope, forKey: Keys.hasSeenProfilescope)
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
        debugLog("🔄 Loading user data...")

        do {
            // Fetch profile
            let profile = try await UserService.shared.fetchProfile()
            self.userProfile = profile
            if let topics = profile.topicPreferences, !topics.isEmpty {
                self.selectedTopics = topics
            }
            debugLog("✅ User profile loaded: \(profile.name)")

            // Fetch stats
            let stats = try await UserService.shared.fetchStats()
            self.userStats = stats
            debugLog("✅ User stats loaded: visibility \(stats.visibilityScore)")

            // Also load success patterns centrally
            await loadSuccessPatternsIfNeeded()

        } catch {
            debugLog("❌ Failed to load user data: \(error)")
        }
    }

    /// Load success patterns once and cache for 30 minutes
    func loadSuccessPatternsIfNeeded() async {
        // Skip if fetched within last 30 minutes
        if let lastFetched = successPatternsLastFetched,
           Date().timeIntervalSince(lastFetched) < 1800 {
            return
        }

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

            var map: [String: Double] = [:]
            for p in response.patterns {
                map["\(p.type):\(p.value.lowercased())"] = p.successRate
                map[p.type] = max(map[p.type] ?? 0, p.successRate)
            }

            self.successPatterns = map
            self.successPatternsLastFetched = Date()
            debugLog("✅ Success patterns loaded centrally: \(response.patterns.count) patterns")
        } catch {
            debugLog("⚠️ Could not load success patterns: \(error)")
        }
    }

    /// Sign out user and reset app state
    func signOut() {
        debugLog("👋 Signing out user...")

        // Delete JWT from Keychain (security: prevent stale credentials)
        try? KeychainService.deleteJWT()

        // Unregister device from push notifications
        Task {
            await PushNotificationService.shared.unregisterDevice()
        }

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
        selectedTopics = []
        successPatterns = [:]
        successPatternsLastFetched = nil

        // Clear persisted onboarding flags
        let defaults = UserDefaults.standard
        defaults.removeObject(forKey: Keys.isAuthenticated)
        defaults.removeObject(forKey: Keys.hasCompletedOnboarding)
        defaults.removeObject(forKey: Keys.hasCompletedToneCalibration)
        defaults.removeObject(forKey: Keys.hasSelectedTopics)
        defaults.removeObject(forKey: Keys.hasSeenProfilescope)

        // Reset navigation
        selectedTab = .home
        navigationPath = NavigationPath()

        debugLog("✅ User signed out successfully")
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
