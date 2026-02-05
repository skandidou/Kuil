//
//  UserProfileVoiceSettingsViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

@MainActor
class UserProfileVoiceSettingsViewModel: ObservableObject {
    @Published var userName: String = "Loading..."
    @Published var userTitle: String = "LinkedIn User"
    @Published var userRole: String = "Professional"
    @Published var primaryTone: String = "Loading..."
    @Published var isLoadingSignature: Bool = false

    // Voice signature data for radar chart (values from 0-10)
    @Published var voiceSignature: [Double] = [0.0, 0.0, 0.0, 0.0, 0.0]

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
        // Settings view is already shown
    }

    func togglePushNotifications() {
        pushNotificationsEnabled.toggle()
        // In production, this would save to UserDefaults and update backend
        print("📱 Push notifications: \(pushNotificationsEnabled ? "enabled" : "disabled")")
    }

    func showAccountStatus() {
        // Show account status details
        print("ℹ️ Account status: \(accountStatus)")
    }

    func showDataPrivacy() {
        // Show data privacy settings
        print("🔒 Opening data privacy settings...")
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
        // Handle subscription
    }

    func openReferral() {
        NotificationCenter.default.post(name: .openReferralProgram, object: nil)
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
