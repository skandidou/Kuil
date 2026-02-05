//
//  ContentView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import AppTrackingTransparency

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var dashboardViewModel = MainDashboardViewModel()
    @StateObject private var toneCalibrationViewModel = ToneCalibrationSwipeFlowViewModel(isOnboarding: true)
    @StateObject private var attService = ATTService.shared

    var body: some View {
        Group {
            if appState.showSplash {
                // Show ONLY splash screen - no content behind
                SplashScreenView()
                    .onAppear {
                        // Dismiss splash after 2.2 seconds
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2.2) {
                            withAnimation(.easeOut(duration: 0.5)) {
                                appState.showSplash = false
                            }
                        }
                    }
            } else {
                // Main content only shows after splash
                mainContent
                    .transition(.opacity)
            }
        }
        .animation(.easeOut(duration: 0.5), value: appState.showSplash)
    }

    @ViewBuilder
    private var mainContent: some View {
        Group {
            if appState.hasCompletedOnboarding {
                // 9. Home (app complete)
                MainDashboardView(viewModel: dashboardViewModel)
                    .transition(.move(edge: .trailing).combined(with: .opacity))

            } else if appState.hasSeenProfilescope && !appState.hasCompletedATTRequest {
                // 8. ATT Request (after profilescope, before paywall/home)
                ATTRequestView {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                        appState.hasCompletedATTRequest = true
                        // For now, go directly to home (paywall will be inserted later)
                        appState.hasCompletedOnboarding = true
                    }
                }
                .transition(.move(edge: .trailing).combined(with: .opacity))

            } else if appState.hasSelectedTopics && !appState.hasSeenProfilescope {
                // 7. Profilescope Result (show voice analysis results)
                ProfileScopeResultView {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                        appState.hasSeenProfilescope = true
                    }
                }
                .transition(.move(edge: .trailing).combined(with: .opacity))

            } else if appState.hasCompletedToneCalibration && !appState.hasSelectedTopics {
                // 6. Topic Interests Selection (Reddit-style)
                TopicInterestsSelectionView { _ in
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                        appState.hasSelectedTopics = true
                    }
                }
                .transition(.move(edge: .trailing).combined(with: .opacity))

            } else if appState.isAuthenticated && !appState.hasCompletedProfileSync {
                // 3. LinkedIn Profile Sync (collect URL for AI voice analysis)
                LinkedInProfileSyncView(
                    onComplete: {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                            appState.hasCompletedProfileSync = true
                        }
                    },
                    onSkip: {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                            appState.hasCompletedProfileSync = true
                        }
                    }
                )
                .transition(.move(edge: .trailing).combined(with: .opacity))

            } else if appState.hasCompletedProfileSync && !appState.hasCompletedToneCalibration {
                // 4-5. Tone Calibration (12 swipes) + Voice Signature Analysis
                ToneCalibrationSwipeFlowView(viewModel: toneCalibrationViewModel, isOnboarding: true)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .onReceive(NotificationCenter.default.publisher(for: .toneCalibrationCompleted)) { _ in
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                            appState.hasCompletedToneCalibration = true
                            // Don't set onboarding complete yet - topics & profilescope come next
                        }
                    }

            } else {
                // 2. Welcome + LinkedIn OAuth
                WelcomeConnectLinkedInView(viewModel: WelcomeConnectLinkedInViewModel())
                    .transition(.opacity)
                    .onReceive(NotificationCenter.default.publisher(for: .linkedInConnected)) { _ in
                        // Load user profile data after LinkedIn connection
                        Task {
                            await appState.loadUserData()

                            // Move to profile sync screen
                            await MainActor.run {
                                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                                    appState.isAuthenticated = true
                                }
                            }
                        }
                    }
            }
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: appState.hasCompletedOnboarding)
        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: appState.hasCompletedProfileSync)
        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: appState.hasCompletedToneCalibration)
        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: appState.hasSelectedTopics)
        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: appState.hasSeenProfilescope)
        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: appState.hasCompletedATTRequest)
        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: appState.isAuthenticated)
        .onReceive(NotificationCenter.default.publisher(for: .userDidSignOut)) { _ in
            withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                appState.signOut()
            }
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AppState.shared)
}
