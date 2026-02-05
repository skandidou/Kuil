//
//  UserProfileVoiceSettingsView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct UserProfileVoiceSettingsView: View {
    @ObservedObject var viewModel: UserProfileVoiceSettingsViewModel
    @EnvironmentObject var appState: AppState
    @Environment(\.colorScheme) var colorScheme
    @State private var showToneCalibration = false
    @State private var chartAppeared = false
    @State private var showAppearancePicker = false

    var body: some View {
        NavigationStack {
            ZStack {
                // Modern gradient background
                LinearGradient(
                    colors: [
                        Color.adaptiveBackground(colorScheme),
                        Color.adaptiveSecondaryBackground(colorScheme).opacity(0.3),
                        Color.adaptiveBackground(colorScheme)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: Spacing.xl) {
                        // Profile Header with modern design
                        profileHeaderView
                            .padding(.top, Spacing.lg)

                        // Voice Signature Card with Pentagon Chart
                        voiceSignatureCard
                            .padding(.horizontal, Spacing.lg)

                        // Pro Plan Card
                        proPlanCard
                            .padding(.horizontal, Spacing.lg)

                        // LinkedIn Account Section
                        linkedInSection
                            .padding(.horizontal, Spacing.lg)

                        // Referral Program Card
                        referralCard
                            .padding(.horizontal, Spacing.lg)

                        // App Settings Section
                        appSettingsSection
                            .padding(.horizontal, Spacing.lg)
                            .padding(.bottom, Spacing.xxl)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showToneCalibration) {
                ToneCalibrationSwipeFlowView(viewModel: ToneCalibrationSwipeFlowViewModel())
            }
            .sheet(isPresented: $showAppearancePicker) {
                appearancePicker
            }
        }
    }

    // MARK: - Profile Header
    private var profileHeaderView: some View {
        VStack(spacing: Spacing.lg) {
            // Avatar with gradient border and verified badge
            ZStack(alignment: .bottomTrailing) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color.appPrimary, Color.accentCyan],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 108, height: 108)

                    Circle()
                        .fill(Color.adaptiveBackground(colorScheme))
                        .frame(width: 100, height: 100)

                    Text(viewModel.userInitials)
                        .font(.system(size: 40, weight: .bold))
                        .foregroundColor(.appPrimary)
                }
                .shadow(color: Color.appPrimary.opacity(0.3), radius: 20)

                // Verified badge
                Circle()
                    .fill(Color.successGreen)
                    .frame(width: 32, height: 32)
                    .overlay(
                        Image(systemName: "checkmark")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                    )
                    .overlay(
                        Circle()
                            .stroke(Color.adaptiveBackground(colorScheme), lineWidth: 3)
                    )
                    .offset(x: 4, y: 4)
            }

            VStack(spacing: Spacing.xs) {
                Text(viewModel.userName)
                    .font(.title1)
                    .fontWeight(.bold)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                Text(viewModel.userTitle)
                    .font(.subheadline)
                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))

                // LinkedIn Connected Badge
                HStack(spacing: Spacing.xs) {
                    Image(systemName: "link")
                        .font(.caption)
                    Text("LinkedIn Connected")
                        .font(.caption)
                        .fontWeight(.semibold)
                }
                .foregroundColor(.appPrimary)
                .padding(.horizontal, Spacing.md)
                .padding(.vertical, 6)
                .background(Color.appPrimary.opacity(0.15))
                .cornerRadius(CornerRadius.large)
            }
        }
    }

    // MARK: - Voice Signature Card
    private var voiceSignatureCard: some View {
        VStack(alignment: .leading, spacing: Spacing.lg) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Voice Signature")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                    Text("Primary Tone")
                        .font(.subheadline)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                }

                Spacer()

                HStack(spacing: 4) {
                    Image(systemName: "arrow.up")
                        .font(.caption2)
                    Text("+12% Confidence")
                        .font(.caption)
                }
                .foregroundColor(.accentCyan)
                .padding(.horizontal, Spacing.sm)
                .padding(.vertical, 4)
                .background(Color.accentCyan.opacity(0.15))
                .cornerRadius(CornerRadius.small)
            }

            // Tone Badge
            HStack(spacing: Spacing.sm) {
                Image(systemName: "brain.head.profile")
                    .font(.title3)
                    .foregroundColor(.appPrimary)

                Text(viewModel.primaryTone)
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
            }
            .padding(Spacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                LinearGradient(
                    colors: [Color.appPrimary.opacity(0.15), Color.accentCyan.opacity(0.1)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .cornerRadius(CornerRadius.medium)

            // Pentagon Radar Chart
            RadarChartView(
                dimensions: ["FORMAL", "BOLD", "EMPATHETIC", "COMPLEXITY", "BREVITY"],
                values: viewModel.voiceSignature
            )
            .frame(height: 280)
            .padding(.vertical, Spacing.md)
            .opacity(chartAppeared ? 1 : 0)
            .scaleEffect(chartAppeared ? 1 : 0.9)
            .onAppear {
                withAnimation(.appBouncy.delay(0.4)) {
                    chartAppeared = true
                }
            }

            // Dimension Details with mini bars
            VStack(spacing: Spacing.sm) {
                ForEach(Array(zip(["FORMAL", "BOLD", "EMPATHETIC", "COMPLEXITY", "BREVITY"], viewModel.voiceSignature)), id: \.0) { label, value in
                    HStack {
                        Text(label)
                            .font(.caption)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                            .frame(width: 90, alignment: .leading)

                        // Mini progress bar
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                Capsule()
                                    .fill(Color.adaptiveSecondaryBackground(colorScheme))
                                    .frame(height: 6)

                                Capsule()
                                    .fill(
                                        LinearGradient(
                                            colors: [Color.appPrimary, Color.accentCyan],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .frame(width: geometry.size.width * (value / 10.0), height: 6)
                            }
                        }
                        .frame(height: 6)

                        Text(String(format: "%.1f", value))
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.appPrimary)
                            .frame(width: 35, alignment: .trailing)
                    }
                }
            }
            .padding(Spacing.md)
            .background(Color.adaptiveBackground(colorScheme).opacity(0.5))
            .cornerRadius(CornerRadius.medium)

            // Re-analyze Button with gradient
            Button(action: {
                showToneCalibration = true
            }) {
                HStack(spacing: Spacing.sm) {
                    Image(systemName: "arrow.clockwise")
                    Text("Re-analyze LinkedIn History")
                        .fontWeight(.semibold)
                }
                .font(.callout)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.md)
                .background(
                    LinearGradient(
                        colors: [Color.appPrimary, Color.accentCyan],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(CornerRadius.medium)
                .shadow(color: Color.appPrimary.opacity(0.4), radius: 12)
            }
        }
        .padding(Spacing.lg)
        .background(
            ZStack {
                Color.adaptiveSecondaryBackground(colorScheme)

                // Subtle gradient overlay
                LinearGradient(
                    colors: [
                        Color.appPrimary.opacity(0.05),
                        Color.clear
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )

                // Border
                RoundedRectangle(cornerRadius: CornerRadius.large)
                    .stroke(Color.appPrimary.opacity(0.2), lineWidth: 1)
            }
        )
        .cornerRadius(CornerRadius.large)
        .shadow(color: Color.appPrimary.opacity(0.1), radius: 20)
    }

    // MARK: - Pro Plan Card
    private var proPlanCard: some View {
        HStack(spacing: Spacing.md) {
            ZStack {
                Circle()
                    .fill(Color.warningYellow.opacity(0.2))
                    .frame(width: 50, height: 50)

                Image(systemName: "star.fill")
                    .foregroundColor(.warningYellow)
                    .font(.title3)
            }

            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text("Pro Plan")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                Text("Billed monthly. Renews Oct 12, 2023.")
                    .font(.caption)
                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
            }

            Spacer()

            Button(action: {
                viewModel.manageSubscription()
            }) {
                HStack(spacing: 4) {
                    Text("Manage")
                    Image(systemName: "chevron.right")
                        .font(.caption)
                }
                .font(.callout)
                .fontWeight(.semibold)
                .foregroundColor(.appPrimary)
                .padding(.horizontal, Spacing.md)
                .padding(.vertical, Spacing.sm)
                .background(Color.appPrimary.opacity(0.15))
                .cornerRadius(CornerRadius.small)
            }
        }
        .padding(Spacing.lg)
        .background(
            LinearGradient(
                colors: [Color.warningYellow.opacity(0.15), Color.warningYellow.opacity(0.05)],
                startPoint: .leading,
                endPoint: .trailing
            )
        )
        .cornerRadius(CornerRadius.large)
        .overlay(
            RoundedRectangle(cornerRadius: CornerRadius.large)
                .stroke(Color.warningYellow.opacity(0.3), lineWidth: 1)
        )
    }

    // MARK: - LinkedIn Section
    private var linkedInSection: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Text("LINKEDIN ACCOUNT")
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))

            VStack(spacing: 0) {
                SettingRow(
                    icon: "person.fill",
                    title: "Account Status",
                    subtitle: viewModel.accountStatus,
                    action: {
                        viewModel.showAccountStatus()
                    },
                    colorScheme: colorScheme
                )

                Divider()
                    .background(Color.adaptiveBackground(colorScheme))
                    .padding(.leading, 60)

                SettingRow(
                    icon: "lock.fill",
                    title: "Data Privacy",
                    subtitle: "Manage AI access",
                    action: {
                        viewModel.showDataPrivacy()
                    },
                    colorScheme: colorScheme
                )
            }
            .background(Color.adaptiveSecondaryBackground(colorScheme))
            .cornerRadius(CornerRadius.large)
        }
    }

    // MARK: - Referral Card
    private var referralCard: some View {
        HStack(spacing: Spacing.md) {
            ZStack {
                Circle()
                    .fill(Color.successGreen.opacity(0.2))
                    .frame(width: 50, height: 50)

                Image(systemName: "gift.fill")
                    .foregroundColor(.successGreen)
                    .font(.title3)
            }

            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text("Referral Program")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(.primaryText)

                Text("Get 1 Month Free for every invite")
                    .font(.caption)
                    .foregroundColor(.secondaryText)
            }

            Spacer()

            Button(action: {
                viewModel.openReferral()
            }) {
                HStack(spacing: Spacing.xs) {
                    Image(systemName: "person.badge.plus")
                    Text("Invite")
                        .fontWeight(.semibold)
                }
                .font(.callout)
                .foregroundColor(.white)
                .padding(.horizontal, Spacing.md)
                .padding(.vertical, Spacing.sm)
                .background(Color.successGreen)
                .cornerRadius(CornerRadius.medium)
                .shadow(color: Color.successGreen.opacity(0.4), radius: 8)
            }
        }
        .padding(Spacing.lg)
        .background(
            LinearGradient(
                colors: [Color.successGreen.opacity(0.15), Color.successGreen.opacity(0.05)],
                startPoint: .leading,
                endPoint: .trailing
            )
        )
        .cornerRadius(CornerRadius.large)
        .overlay(
            RoundedRectangle(cornerRadius: CornerRadius.large)
                .stroke(Color.successGreen.opacity(0.3), lineWidth: 1)
        )
    }

    // MARK: - App Settings Section
    private var appSettingsSection: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Text("APP SETTINGS")
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))

            VStack(spacing: 0) {
                // Push Notifications Toggle
                HStack {
                    Image(systemName: "bell.fill")
                        .foregroundColor(.appPrimary)
                        .font(.title3)
                        .frame(width: 40)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Push Notifications")
                            .font(.body)
                            .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                        Text("Get notified about engagement")
                            .font(.caption)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                    }

                    Spacer()

                    Toggle("", isOn: $viewModel.pushNotificationsEnabled)
                        .tint(Color.appPrimary)
                        .onChange(of: viewModel.pushNotificationsEnabled) { _, _ in
                            viewModel.togglePushNotifications()
                        }
                }
                .padding(Spacing.md)

                Divider()
                    .background(Color.adaptiveBackground(colorScheme))
                    .padding(.leading, 60)

                SettingRow(
                    icon: "moon.fill",
                    title: "Appearance",
                    subtitle: appearanceLabel(),
                    action: {
                        showAppearancePicker = true
                    },
                    colorScheme: colorScheme
                )

                Divider()
                    .background(Color.adaptiveBackground(colorScheme))
                    .padding(.leading, 60)

                SettingRow(
                    icon: "arrow.right.square.fill",
                    title: "Sign Out",
                    subtitle: nil,
                    titleColor: .errorRed,
                    iconColor: .errorRed,
                    action: {
                        viewModel.signOut()
                    },
                    colorScheme: colorScheme
                )
            }
            .background(Color.adaptiveSecondaryBackground(colorScheme))
            .cornerRadius(CornerRadius.large)
        }
    }

    // MARK: - Helper Methods
    private func appearanceLabel() -> String {
        if let scheme = appState.colorScheme {
            return scheme == .light ? "Light" : "Dark"
        }
        return "System"
    }

    // MARK: - Appearance Picker
    private var appearancePicker: some View {
        NavigationView {
            List {
                Section {
                    Button(action: {
                        appState.setColorScheme(nil)
                        showAppearancePicker = false
                    }) {
                        HStack {
                            Text("System")
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            Spacer()
                            if appState.colorScheme == nil {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.appPrimary)
                            }
                        }
                    }

                    Button(action: {
                        appState.setColorScheme(.light)
                        showAppearancePicker = false
                    }) {
                        HStack {
                            Text("Light")
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            Spacer()
                            if appState.colorScheme == .light {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.appPrimary)
                            }
                        }
                    }

                    Button(action: {
                        appState.setColorScheme(.dark)
                        showAppearancePicker = false
                    }) {
                        HStack {
                            Text("Dark")
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            Spacer()
                            if appState.colorScheme == .dark {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.appPrimary)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Appearance")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showAppearancePicker = false
                    }
                }
            }
        }
    }
}

struct SettingRow: View {
    let icon: String
    let title: String
    let subtitle: String?
    var titleColor: Color = .primaryText
    var iconColor: Color = .appPrimary
    let action: () -> Void
    let colorScheme: ColorScheme

    var body: some View {
        Button(action: action) {
            HStack(spacing: Spacing.md) {
                Image(systemName: icon)
                    .foregroundColor(iconColor)
                    .font(.title3)
                    .frame(width: 40)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.body)
                        .foregroundColor(titleColor == .primaryText ? Color.adaptivePrimaryText(colorScheme) : titleColor)

                    if let subtitle = subtitle {
                        Text(subtitle)
                            .font(.caption)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                    }
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                    .font(.caption)
            }
            .padding(Spacing.md)
        }
    }
}

#Preview {
    UserProfileVoiceSettingsView(viewModel: UserProfileVoiceSettingsViewModel())
}
