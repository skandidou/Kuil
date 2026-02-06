//
//  UserProfileVoiceSettingsViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

// MARK: - Models for profile enrichment

struct VoiceEvolutionEntry: Identifiable, Codable {
    var id: String { createdAt }
    let formal: Double
    let bold: Double
    let empathetic: Double
    let complexity: Double
    let brevity: Double
    let primaryTone: String
    let triggerReason: String?
    let createdAt: String
}

struct UserSuccessPattern: Identifiable {
    let id = UUID()
    let type: String
    let value: String
    let successRate: Double
    let avgEngagement: Double
}

@MainActor
class UserProfileVoiceSettingsViewModel: ObservableObject {
    @Published var userName: String = "Loading..."
    @Published var userTitle: String = "LinkedIn User"
    @Published var userRole: String = "Professional"
    @Published var primaryTone: String = "Loading..."
    @Published var isLoadingSignature: Bool = false

    // Voice signature data for radar chart (values from 0-10)
    @Published var voiceSignature: [Double] = [0.0, 0.0, 0.0, 0.0, 0.0]

    // Voice metadata
    @Published var postsAnalyzed: Int = 0
    @Published var lastAnalyzedAt: String?
    @Published var confidence: Double = 0.0
    @Published var confidenceLabel: String = ""

    // Evolution history
    @Published var evolutionHistory: [VoiceEvolutionEntry] = []

    // Success patterns
    @Published var successPatterns: [UserSuccessPattern] = []

    // Settings
    @Published var pushNotificationsEnabled: Bool = true
    @Published var accountStatus: String = "Active & Syncing"

    private var cancellables = Set<AnyCancellable>()

    var userInitials: String {
        let components = userName.components(separatedBy: " ")
        let initials = components.compactMap { $0.first }.map { String($0) }.joined()
        return String(initials.prefix(2))
    }

    init() {
        // Subscribe to AppState for real user data
        AppState.shared.$userProfile
            .compactMap { $0 }
            .sink { [weak self] profile in
                self?.userName = profile.name
                self?.userTitle = profile.headline ?? "LinkedIn User"
                self?.userRole = profile.role ?? "Professional"

                if let signature = profile.voiceSignature {
                    self?.voiceSignature = [
                        signature.formal,
                        signature.bold,
                        signature.empathetic,
                        signature.complexity,
                        signature.brevity
                    ]
                    self?.primaryTone = signature.primaryTone
                    self?.postsAnalyzed = signature.postsAnalyzed ?? 0
                    self?.lastAnalyzedAt = signature.lastAnalyzedAt
                    self?.confidence = signature.confidence
                    self?.confidenceLabel = self?.confidenceLabelFor(signature.confidence) ?? ""
                } else {
                    // No voice signature yet - load it from backend
                    self?.loadVoiceSignature()
                }
            }
            .store(in: &cancellables)

        // Load profile if not already loaded
        if AppState.shared.userProfile == nil {
            Task {
                do {
                    let profile = try await UserService.shared.fetchProfile()
                    await MainActor.run {
                        AppState.shared.userProfile = profile
                    }
                } catch {
                    print("Failed to load profile: \(error)")
                }
            }
        } else {
            // Profile exists but maybe no voice signature
            loadVoiceSignature()
        }

        // Load additional data
        Task { await loadEvolutionHistory() }
        Task { await loadSuccessPatterns() }
    }

    private func confidenceLabelFor(_ value: Double) -> String {
        if value >= 0.8 { return "High" }
        if value >= 0.5 { return "Medium" }
        return "Low"
    }

    func loadEvolutionHistory() async {
        do {
            struct EvolutionResponse: Codable {
                let history: [VoiceEvolutionEntry]
            }

            let response: EvolutionResponse = try await APIClient.shared.get(
                endpoint: "/api/voice/evolution-history",
                requiresAuth: true
            )

            await MainActor.run {
                self.evolutionHistory = Array(response.history.prefix(5))
            }
        } catch {
            print("Failed to load evolution history: \(error)")
        }
    }

    func loadSuccessPatterns() async {
        do {
            struct PatternsResponse: Codable {
                let patterns: [PatternItem]
            }
            struct PatternItem: Codable {
                let type: String
                let value: String
                let successRate: Double
                let avgEngagement: Double?
            }

            let response: PatternsResponse = try await APIClient.shared.get(
                endpoint: "/api/voice/success-patterns",
                requiresAuth: true
            )

            await MainActor.run {
                self.successPatterns = response.patterns.prefix(5).map {
                    UserSuccessPattern(
                        type: $0.type,
                        value: $0.value,
                        successRate: $0.successRate,
                        avgEngagement: $0.avgEngagement ?? 0
                    )
                }
            }
        } catch {
            print("Failed to load success patterns: \(error)")
        }
    }

    private func loadVoiceSignature() {
        guard !isLoadingSignature else { return }
        isLoadingSignature = true

        Task {
            do {
                print("🎤 Loading voice signature from backend...")

                if let signature = try await ClaudeService.shared.fetchVoiceSignature() {
                    await MainActor.run {
                        self.voiceSignature = signature.radarValues
                        self.primaryTone = signature.primaryTone
                        self.isLoadingSignature = false
                    }
                    print("✅ Voice signature loaded: \(signature.primaryTone)")
                } else {
                    // No existing signature - analyze now
                    print("📊 No voice signature found, analyzing...")
                    let newSignature = try await ClaudeService.shared.analyzeVoiceSignature()
                    await MainActor.run {
                        self.voiceSignature = newSignature.radarValues
                        self.primaryTone = newSignature.primaryTone
                        self.isLoadingSignature = false
                    }
                    print("✅ Voice signature analyzed: \(newSignature.primaryTone)")
                }
            } catch {
                print("❌ Failed to load voice signature: \(error)")
                await MainActor.run {
                    self.isLoadingSignature = false
                    // Set default "unknown" state
                    self.primaryTone = "Analyzing..."
                }
            }
        }
    }

    func back() {
        NotificationCenter.default.post(name: .profileBack, object: nil)
    }

    func showSettings() {
        // Settings view is already the current view
    }

    @Published var showInfoAlert = false
    @Published var infoAlertTitle: String = ""
    @Published var infoAlertMessage: String = ""

    func togglePushNotifications() {
        pushNotificationsEnabled.toggle()
        // In production, this would save to UserDefaults and update backend
        print("📱 Push notifications: \(pushNotificationsEnabled ? "enabled" : "disabled")")
    }

    func showAccountStatus() {
        infoAlertTitle = "Account Status"
        infoAlertMessage = "Your LinkedIn account is \(accountStatus). Kuil syncs your profile data to personalize AI-generated content."
        showInfoAlert = true
    }

    func showDataPrivacy() {
        infoAlertTitle = "Data Privacy"
        infoAlertMessage = "Kuil uses your LinkedIn data solely to generate personalized content. Your data is encrypted and never shared with third parties. You can revoke access at any time by disconnecting your LinkedIn account."
        showInfoAlert = true
    }

    func reanalyzeProfile() {
        Task {
            do {
                print("🤖 Starting voice re-analysis with Claude...")

                // Call backend API to analyze voice with Gemini
                let response: VoiceSignatureData = try await APIClient.shared.post(
                    endpoint: Config.Endpoints.voiceAnalyze,
                    body: [:]
                )

                await MainActor.run {
                    self.voiceSignature = [
                        response.formal,
                        response.bold,
                        response.empathetic,
                        response.complexity,
                        response.brevity
                    ]
                    self.primaryTone = response.primaryTone

                    // Update AppState
                    if var profile = AppState.shared.userProfile {
                        profile.voiceSignature = response
                        AppState.shared.userProfile = profile
                    }
                }

                print("✅ Voice signature updated")
            } catch {
                print("❌ Error reanalyzing profile: \(error)")
            }
        }
    }

    func manageSubscription() {
        infoAlertTitle = "Subscription"
        infoAlertMessage = "Subscription management is coming in a future update."
        showInfoAlert = true
    }

    func signOut() {
        LinkedInService.shared.signOut()
        NotificationCenter.default.post(name: .userDidSignOut, object: nil)
    }

    func loadProfile() {
        Task {
            // Load LinkedIn profile
            if let profile = try? await LinkedInService.shared.fetchProfile() {
                userName = profile.fullName
                userTitle = profile.headline ?? "LinkedIn User"
            }

            // Load voice signature
            if let signature = try? await ClaudeService.shared.fetchVoiceSignature() {
                voiceSignature = signature.radarValues
                primaryTone = signature.primaryTone
            }
        }
    }
}

extension Notification.Name {
    static let profileBack = Notification.Name("profileBack")
    static let openReferralProgram = Notification.Name("openReferralProgram")
    static let userDidSignOut = Notification.Name("userDidSignOut")
}
