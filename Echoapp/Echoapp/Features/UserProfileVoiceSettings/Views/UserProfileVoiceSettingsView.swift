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
    @State private var showTopicEditor = false
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

                        // Success Patterns Section
                        if !viewModel.successPatterns.isEmpty {
                            successPatternsSection
                                .padding(.horizontal, Spacing.lg)
                        }

                        // Voice Evolution History
                        if !viewModel.evolutionHistory.isEmpty {
                            evolutionHistorySection
                                .padding(.horizontal, Spacing.lg)
                        }

                        // LinkedIn Account Section
                        linkedInSection
                            .padding(.horizontal, Spacing.lg)

                        // Preferences Section (Redo Calibration + Edit Topics)
                        preferencesSection
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
            .sheet(isPresented: $showTopicEditor) {
                TopicInterestsSelectionView { updatedTopics in
                    appState.selectedTopics = updatedTopics
                    showTopicEditor = false
                }
            }
            .sheet(isPresented: $showAppearancePicker) {
                appearancePicker
            }
            .alert(viewModel.infoAlertTitle, isPresented: $viewModel.showInfoAlert) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.infoAlertMessage)
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

                if !viewModel.confidenceLabel.isEmpty {
                    HStack(spacing: 4) {
                        Image(systemName: confidenceIcon(viewModel.confidenceLabel))
                            .font(.caption2)
                        Text("\(viewModel.confidenceLabel) Confidence")
                            .font(.caption)
                    }
                    .foregroundColor(confidenceColor(viewModel.confidenceLabel))
                    .padding(.horizontal, Spacing.sm)
                    .padding(.vertical, 4)
                    .background(confidenceColor(viewModel.confidenceLabel).opacity(0.15))
                    .cornerRadius(CornerRadius.small)
                }
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

            // Voice Metadata
            if viewModel.postsAnalyzed > 0 {
                HStack {
                    HStack(spacing: 6) {
                        Image(systemName: "doc.text.fill")
                            .font(.caption2)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                        Text("\(viewModel.postsAnalyzed) posts analyzed")
                            .font(.caption)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                    }

                    Spacer()

                    if let lastDate = viewModel.lastAnalyzedAt {
                        HStack(spacing: 4) {
                            Image(systemName: "clock.fill")
                                .font(.caption2)
                            Text(formatRelativeDate(lastDate))
                                .font(.caption)
                        }
                        .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                    }
                }
                .padding(Spacing.sm)
                .background(Color.adaptiveBackground(colorScheme).opacity(0.5))
                .cornerRadius(CornerRadius.small)
            }

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

    // MARK: - Success Patterns Section
    private var successPatternsSection: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            HStack {
                Image(systemName: "trophy.fill")
                    .foregroundColor(.warningYellow)
                    .font(.title3)
                Text("Your Style DNA")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
            }

            VStack(spacing: Spacing.sm) {
                ForEach(viewModel.successPatterns) { pattern in
                    HStack(spacing: Spacing.md) {
                        Image(systemName: patternTypeIcon(pattern.type))
                            .foregroundColor(.appPrimary)
                            .font(.callout)
                            .frame(width: 28)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(formatPatternLabel(pattern.type))
                                .font(.caption)
                                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                            Text(pattern.value)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                        }

                        Spacer()

                        VStack(alignment: .trailing, spacing: 2) {
                            Text("\(Int(pattern.successRate * 100))%")
                                .font(.headline)
                                .fontWeight(.bold)
                                .foregroundColor(.successGreen)
                            Text("success")
                                .font(.caption2)
                                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                        }
                    }
                    .padding(Spacing.md)
                    .background(Color.adaptiveBackground(colorScheme).opacity(0.5))
                    .cornerRadius(CornerRadius.medium)
                }
            }
        }
        .padding(Spacing.lg)
        .background(Color.adaptiveSecondaryBackground(colorScheme))
        .cornerRadius(CornerRadius.large)
        .overlay(
            RoundedRectangle(cornerRadius: CornerRadius.large)
                .stroke(Color.warningYellow.opacity(0.2), lineWidth: 1)
        )
    }

    // MARK: - Evolution History Section
    private var evolutionHistorySection: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            HStack {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .foregroundColor(.accentCyan)
                    .font(.title3)
                Text("Voice Evolution")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
            }

            VStack(spacing: 0) {
                ForEach(Array(viewModel.evolutionHistory.enumerated()), id: \.element.id) { index, entry in
                    HStack(spacing: Spacing.md) {
                        // Timeline dot & line
                        VStack(spacing: 0) {
                            Circle()
                                .fill(index == 0 ? Color.appPrimary : Color.adaptiveTertiaryText(colorScheme).opacity(0.4))
                                .frame(width: 10, height: 10)

                            if index < viewModel.evolutionHistory.count - 1 {
                                Rectangle()
                                    .fill(Color.adaptiveTertiaryText(colorScheme).opacity(0.2))
                                    .frame(width: 2)
                                    .frame(maxHeight: .infinity)
                            }
                        }
                        .frame(width: 10)

                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(entry.primaryTone)
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                                    .foregroundColor(index == 0 ? Color.appPrimary : Color.adaptivePrimaryText(colorScheme))

                                Spacer()

                                Text(formatShortDate(entry.createdAt))
                                    .font(.caption2)
                                    .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                            }

                            if let reason = entry.triggerReason {
                                Text(formatTriggerReason(reason))
                                    .font(.caption)
                                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                            }
                        }
                        .padding(.vertical, Spacing.sm)
                    }
                }
            }
        }
        .padding(Spacing.lg)
        .background(Color.adaptiveSecondaryBackground(colorScheme))
        .cornerRadius(CornerRadius.large)
        .overlay(
            RoundedRectangle(cornerRadius: CornerRadius.large)
                .stroke(Color.accentCyan.opacity(0.2), lineWidth: 1)
        )
    }

    // MARK: - Preferences Section
    private var preferencesSection: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Text("PREFERENCES")
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))

            VStack(spacing: 0) {
                // Redo Tone Calibration
                SettingRow(
                    icon: "waveform.path.ecg",
                    title: "Redo Tone Calibration",
                    subtitle: "Re-analyze your writing style",
                    action: {
                        showToneCalibration = true
                    },
                    colorScheme: colorScheme
                )

                Divider()
                    .background(Color.adaptiveBackground(colorScheme))
                    .padding(.leading, 60)

                // Edit Topic Interests
                SettingRow(
                    icon: "tag.fill",
                    title: "Edit Topic Interests",
                    subtitle: appState.selectedTopics.isEmpty
                        ? "Choose your content topics"
                        : "\(appState.selectedTopics.count) topics selected",
                    action: {
                        showTopicEditor = true
                    },
                    colorScheme: colorScheme
                )
            }
            .background(Color.adaptiveSecondaryBackground(colorScheme))
            .cornerRadius(CornerRadius.large)
        }
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

    private func confidenceIcon(_ label: String) -> String {
        switch label {
        case "High": return "checkmark.shield.fill"
        case "Medium": return "shield.lefthalf.filled"
        default: return "shield"
        }
    }

    private func confidenceColor(_ label: String) -> Color {
        switch label {
        case "High": return .successGreen
        case "Medium": return .accentCyan
        default: return .warningYellow
        }
    }

    private func patternTypeIcon(_ type: String) -> String {
        switch type.lowercased() {
        case "hook_style": return "text.quote"
        case "length": return "ruler"
        case "structure": return "list.bullet"
        case "emoji_usage": return "face.smiling"
        case "cta_style": return "arrow.right.circle"
        default: return "sparkles"
        }
    }

    private func formatPatternLabel(_ type: String) -> String {
        switch type.lowercased() {
        case "hook_style": return "HOOK STYLE"
        case "length": return "IDEAL LENGTH"
        case "structure": return "POST STRUCTURE"
        case "emoji_usage": return "EMOJI USAGE"
        case "cta_style": return "CALL TO ACTION"
        default: return type.uppercased()
        }
    }

    private func formatRelativeDate(_ isoString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        var date = formatter.date(from: isoString)
        if date == nil {
            formatter.formatOptions = [.withInternetDateTime]
            date = formatter.date(from: isoString)
        }
        guard let parsed = date else { return "Recently" }

        let days = Calendar.current.dateComponents([.day], from: parsed, to: Date()).day ?? 0
        if days == 0 { return "Today" }
        if days == 1 { return "Yesterday" }
        if days < 7 { return "\(days) days ago" }
        if days < 30 { return "\(days / 7) weeks ago" }
        return "\(days / 30) months ago"
    }

    private func formatShortDate(_ isoString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        var date = formatter.date(from: isoString)
        if date == nil {
            formatter.formatOptions = [.withInternetDateTime]
            date = formatter.date(from: isoString)
        }
        guard let parsed = date else { return "" }

        let df = DateFormatter()
        df.dateFormat = "MMM d"
        return df.string(from: parsed)
    }

    private func formatTriggerReason(_ reason: String) -> String {
        switch reason.lowercased() {
        case "periodic": return "Scheduled re-analysis"
        case "manual": return "Manual re-analysis"
        case "threshold": return "New posts threshold reached"
        case "initial": return "Initial analysis"
        default: return reason.capitalized
        }
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
    var titleColor: Color = .clear
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
                        .foregroundColor(titleColor == .clear ? Color.adaptivePrimaryText(colorScheme) : titleColor)

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
