//
//  SmartAIEditorHookScorerView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct SmartAIEditorHookScorerView: View {
    @ObservedObject var viewModel: SmartAIEditorHookScorerViewModel
    @Environment(\.colorScheme) var colorScheme
    @State private var selectedView: ContentViewType = .mobile
    @FocusState private var isEditorFocused: Bool
    @State private var animatedHookScore: Double = 0
    @State private var showSuggestion = false
    @State private var toolbarExpanded = false

    var body: some View {
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

            VStack(spacing: 0) {
                // Modern header with glass effect
                headerView
                    .padding(.horizontal, Spacing.lg)
                    .padding(.top, Spacing.lg)
                    .background(
                        Color.adaptiveSecondaryBackground(colorScheme).opacity(0.5)
                            .blur(radius: 10)
                    )

                // View Selector with custom styling
                viewSelectorView
                    .padding(.horizontal, Spacing.lg)
                    .padding(.top, Spacing.md)

                ScrollView {
                    VStack(spacing: Spacing.xl) {
                        // Enhanced Hook Score Card with animation
                        hookScoreCard
                            .padding(.horizontal, Spacing.lg)
                            .padding(.top, Spacing.lg)

                        // Modern editor toolbar
                        editorToolbarView
                            .padding(.horizontal, Spacing.lg)

                        // Enhanced content editor
                        contentEditorView
                            .padding(.horizontal, Spacing.lg)

                        // Bottom action bar
                        bottomActionBar
                            .padding(.horizontal, Spacing.lg)
                            .padding(.bottom, Spacing.xl)
                    }
                }
            }
        }
        .onAppear {
            withAnimation(.appDefault.delay(0.3)) {
                animatedHookScore = Double(viewModel.hookScore)
            }
        }
        .onChange(of: viewModel.hookScore) { oldValue, newValue in
            withAnimation(.appBouncy) {
                animatedHookScore = Double(newValue)
            }
        }
        .sheet(isPresented: $viewModel.showSchedulePicker) {
            scheduleDatePicker
        }
    }

    // MARK: - Header
    private var headerView: some View {
        HStack {
            Button(action: {
                viewModel.back()
            }) {
                Image(systemName: "arrow.left")
                    .font(.title3)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                    .frame(width: 44, height: 44)
                    .background(Color.adaptiveSecondaryBackground(colorScheme))
                    .clipShape(Circle())
            }

            VStack(spacing: 4) {
                Text("Smart Editor")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                HStack(spacing: 4) {
                    Circle()
                        .fill(Color.accentCyan)
                        .frame(width: 6, height: 6)

                    Text("AI POWERED")
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundColor(.accentCyan)
                }
            }
            .frame(maxWidth: .infinity)

            Button(action: {
                viewModel.post()
            }) {
                HStack(spacing: Spacing.xs) {
                    Image(systemName: "paperplane.fill")
                    Text("Post")
                }
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .padding(.horizontal, Spacing.md)
                .padding(.vertical, Spacing.sm)
                .background(
                    LinearGradient(
                        colors: [Color.appPrimary, Color.accentCyan],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(CornerRadius.medium)
            }
        }
    }

    // MARK: - View Selector
    private var viewSelectorView: some View {
        HStack(spacing: 0) {
            ForEach([ContentViewType.mobile, ContentViewType.desktop], id: \.self) { viewType in
                Button(action: {
                    withAnimation(.appQuick) {
                        selectedView = viewType
                    }
                }) {
                    HStack(spacing: Spacing.xs) {
                        Image(systemName: viewType == .mobile ? "iphone" : "desktopcomputer")
                            .font(.caption)

                        Text(viewType == .mobile ? "MOBILE" : "DESKTOP")
                            .font(.caption)
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(selectedView == viewType ? .white : .secondaryText)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Spacing.sm)
                    .background(
                        selectedView == viewType ?
                            LinearGradient(
                                colors: [Color.appPrimary, Color.accentCyan],
                                startPoint: .leading,
                                endPoint: .trailing
                            ) : LinearGradient(colors: [Color.clear], startPoint: .leading, endPoint: .trailing)
                    )
                    .cornerRadius(CornerRadius.small)
                }
            }
        }
        .padding(4)
        .background(Color.adaptiveSecondaryBackground(colorScheme))
        .cornerRadius(CornerRadius.small)
    }

    // MARK: - Hook Score Card
    private var hookScoreCard: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            HStack {
                HStack(spacing: Spacing.sm) {
                    Image(systemName: "sparkles")
                        .foregroundColor(.appPrimary)
                        .font(.title3)

                    Text("Hook Score")
                        .font(.headline)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                }

                Spacer()

                HStack(spacing: 4) {
                    AnimatedNumberView(value: animatedHookScore, fontSize: 32, fontWeight: .bold)
                        .foregroundColor(hookScoreColor(animatedHookScore))

                    Text("/100")
                        .font(.title3)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                }
            }

            // Animated progress bar with gradient
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    // Background track
                    Capsule()
                        .fill(Color.adaptiveSecondaryBackground(colorScheme))
                        .frame(height: 10)

                    // Gradient progress
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: hookScoreGradient(animatedHookScore),
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geometry.size.width * (animatedHookScore / 100), height: 10)
                        .animation(.appDefault, value: animatedHookScore)

                    // Glow effect
                    Capsule()
                        .fill(hookScoreColor(animatedHookScore).opacity(0.4))
                        .frame(width: geometry.size.width * (animatedHookScore / 100), height: 10)
                        .blur(radius: 6)
                        .animation(.appDefault, value: animatedHookScore)
                }
            }
            .frame(height: 10)

            // Score message with icon
            HStack(spacing: Spacing.sm) {
                Image(systemName: hookScoreIcon(animatedHookScore))
                    .foregroundColor(hookScoreColor(animatedHookScore))
                    .font(.callout)

                Text(hookScoreMessage(animatedHookScore))
                    .font(.callout)
                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
            }
            .padding(.top, Spacing.xs)
        }
        .padding(Spacing.lg)
        .background(
            ZStack {
                Color.adaptiveSecondaryBackground(colorScheme)

                // Subtle gradient overlay
                LinearGradient(
                    colors: [
                        hookScoreColor(animatedHookScore).opacity(0.1),
                        Color.clear
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )

                // Border glow
                RoundedRectangle(cornerRadius: CornerRadius.large)
                    .stroke(
                        hookScoreColor(animatedHookScore).opacity(0.3),
                        lineWidth: 1
                    )
            }
        )
        .cornerRadius(CornerRadius.large)
        .shadow(color: hookScoreColor(animatedHookScore).opacity(0.2), radius: 20)
    }

    // MARK: - Editor Toolbar
    private var editorToolbarView: some View {
        VStack(spacing: Spacing.md) {
            HStack(spacing: Spacing.md) {
                // Text formatting buttons
                ForEach(toolbarButtons, id: \.icon) { button in
                    Button(action: button.action) {
                        Group {
                            if let icon = button.icon {
                                Image(systemName: icon)
                            } else if let text = button.text {
                                Text(text)
                                    .fontWeight(button.isBold ? .bold : .regular)
                                    .italic(button.isItalic)
                            }
                        }
                        .font(.headline)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                        .frame(width: 40, height: 40)
                        .background(Color.adaptiveSecondaryBackground(colorScheme))
                        .cornerRadius(CornerRadius.small)
                    }
                }

                Spacer()

                // AI Cleanup button with gradient
                Button(action: {
                    viewModel.aiCleanup()
                }) {
                    HStack(spacing: Spacing.xs) {
                        Image(systemName: "sparkles")
                            .font(.callout)
                        Text("AI ENHANCE")
                            .font(.caption)
                            .fontWeight(.bold)
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, Spacing.md)
                    .padding(.vertical, Spacing.sm)
                    .background(
                        LinearGradient(
                            colors: [Color.appPrimary, Color.accentCyan],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(CornerRadius.medium)
                    .shadow(color: Color.appPrimary.opacity(0.4), radius: 8)
                }
            }
        }
    }

    private var toolbarButtons: [ToolbarButton] {
        [
            ToolbarButton(text: "B", isBold: true, action: {}),
            ToolbarButton(text: "I", isItalic: true, action: {}),
            ToolbarButton(icon: "list.bullet", action: {}),
            ToolbarButton(icon: "link", action: {}),
            ToolbarButton(text: "@", action: {}),
            ToolbarButton(text: "#", action: {})
        ]
    }

    // MARK: - Content Editor
    private var contentEditorView: some View {
        ZStack(alignment: .bottomTrailing) {
            VStack(spacing: 0) {
                TextEditor(text: $viewModel.content)
                    .focused($isEditorFocused)
                    .font(.body)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                    .scrollContentBackground(.hidden)
                    .frame(minHeight: 350)
                    .padding(Spacing.lg)
            }
            .background(
                ZStack {
                    Color.adaptiveSecondaryBackground(colorScheme)

                    // Subtle grid pattern
                    if viewModel.content.isEmpty {
                        VStack(spacing: Spacing.md) {
                            Image(systemName: "doc.text")
                                .font(.system(size: 50))
                                .foregroundColor(Color.adaptiveTertiaryText(colorScheme).opacity(0.3))

                            Text("Start writing your post...")
                                .font(.body)
                                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                        }
                    }
                }
            )
            .cornerRadius(CornerRadius.large)
            .overlay(
                RoundedRectangle(cornerRadius: CornerRadius.large)
                    .stroke(
                        isEditorFocused ?
                            LinearGradient(
                                colors: [Color.appPrimary, Color.accentCyan],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ) : LinearGradient(colors: [Color.clear], startPoint: .topLeading, endPoint: .bottomTrailing),
                        lineWidth: 2
                    )
            )
            .shadow(color: isEditorFocused ? Color.appPrimary.opacity(0.2) : Color.clear, radius: 20)

            // AI Suggestion Bubble with animation
            if let suggestion = viewModel.aiSuggestion {
                VStack(alignment: .trailing, spacing: Spacing.xs) {
                    HStack(spacing: Spacing.sm) {
                        Image(systemName: "sparkles")
                            .font(.caption)

                        Text(suggestion)
                            .font(.callout)
                            .foregroundColor(.white)
                    }
                    .padding(Spacing.md)
                    .background(
                        LinearGradient(
                            colors: [Color.appPrimary, Color.accentCyan],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(CornerRadius.medium)
                    .shadow(color: Color.appPrimary.opacity(0.4), radius: 12)

                    Image(systemName: "arrowtriangle.down.fill")
                        .foregroundColor(.appPrimary)
                        .font(.title3)
                        .offset(x: -20, y: -8)
                }
                .padding(.trailing, Spacing.xl)
                .padding(.bottom, Spacing.xxl)
                .transition(.scale.combined(with: .opacity))
                .opacity(showSuggestion ? 1 : 0)
                .scaleEffect(showSuggestion ? 1 : 0.8)
                .onAppear {
                    withAnimation(.appBouncy.delay(0.2)) {
                        showSuggestion = true
                    }
                }
            }

            // Floating Action Button with pulse
            Button(action: {
                viewModel.showOptions()
            }) {
                Image(systemName: "slider.horizontal.3")
                    .font(.title3)
                    .foregroundColor(.white)
                    .frame(width: 56, height: 56)
                    .background(
                        LinearGradient(
                            colors: [Color.appPrimary, Color.accentCyan],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .clipShape(Circle())
                    .shadow(color: Color.appPrimary.opacity(0.5), radius: 15)
            }
            .padding(.trailing, Spacing.xl)
            .padding(.bottom, Spacing.xl)
        }
    }

    // MARK: - Bottom Action Bar
    private var bottomActionBar: some View {
        HStack(spacing: Spacing.lg) {
            // Character count with progress
            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text("CHARACTER COUNT")
                    .font(.caption2)
                    .foregroundColor(Color.adaptiveTertiaryText(colorScheme))

                HStack(spacing: Spacing.xs) {
                    Text("\(viewModel.content.count)")
                        .font(.callout)
                        .fontWeight(.bold)
                        .foregroundColor(characterCountColor())

                    Text("/ 3000")
                        .font(.caption)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                }
            }

            Spacer()

            // Schedule button
            Button(action: {
                viewModel.schedule()
            }) {
                VStack(spacing: 4) {
                    Image(systemName: "clock")
                        .font(.title3)
                    Text("Schedule")
                        .font(.caption2)
                }
                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                .frame(width: 70, height: 60)
                .background(Color.adaptiveSecondaryBackground(colorScheme))
                .cornerRadius(CornerRadius.medium)
            }

            Spacer()

            // Next button
            Button(action: {
                viewModel.next()
            }) {
                HStack(spacing: Spacing.xs) {
                    Text("Next")
                        .fontWeight(.semibold)
                    Image(systemName: "arrow.right")
                }
                .foregroundColor(.white)
                .padding(.horizontal, Spacing.lg)
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
    }

    // MARK: - Helper Functions
    private func hookScoreColor(_ score: Double) -> Color {
        switch score {
        case 0..<40: return .errorRed
        case 40..<70: return .warningYellow
        default: return .successGreen
        }
    }

    private func hookScoreGradient(_ score: Double) -> [Color] {
        switch score {
        case 0..<40: return [Color.errorRed.opacity(0.8), Color.errorRed]
        case 40..<70: return [Color.warningYellow.opacity(0.8), Color.warningYellow]
        default: return [Color.successGreen.opacity(0.8), Color.accentTeal]
        }
    }

    private func hookScoreMessage(_ score: Double) -> String {
        switch score {
        case 0..<40: return "Needs improvement. Try a stronger opening to grab attention."
        case 40..<70: return "Good start! Consider adding more intrigue or emotion."
        default: return "Excellent! Your hook is highly engaging and attention-grabbing."
        }
    }

    private func hookScoreIcon(_ score: Double) -> String {
        switch score {
        case 0..<40: return "exclamationmark.triangle.fill"
        case 40..<70: return "info.circle.fill"
        default: return "checkmark.circle.fill"
        }
    }

    private func characterCountColor() -> Color {
        let count = viewModel.content.count
        if count > 2700 {
            return .errorRed
        } else if count > 2400 {
            return .warningYellow
        } else {
            return .appPrimary
        }
    }

    // MARK: - Schedule Date Picker
    private var scheduleDatePicker: some View {
        NavigationView {
            VStack(spacing: Spacing.lg) {
                Text("Schedule Post")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                    .padding(.top, Spacing.lg)

                DatePicker(
                    "Select Date & Time",
                    selection: $viewModel.scheduledDate,
                    in: Date()...,
                    displayedComponents: [.date, .hourAndMinute]
                )
                .datePickerStyle(.graphical)
                .tint(.appPrimary)
                .padding(.horizontal, Spacing.lg)

                VStack(alignment: .leading, spacing: Spacing.sm) {
                    HStack {
                        Image(systemName: "calendar")
                            .foregroundColor(.appPrimary)
                        Text("Scheduled for:")
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                    }
                    .font(.caption)

                    Text(viewModel.scheduledDate.formatted(date: .long, time: .shortened))
                        .font(.body)
                        .fontWeight(.semibold)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(Spacing.md)
                .background(Color.adaptiveSecondaryBackground(colorScheme))
                .cornerRadius(CornerRadius.medium)
                .padding(.horizontal, Spacing.lg)

                Spacer()

                // Action buttons
                HStack(spacing: Spacing.md) {
                    SecondaryButton("Cancel") {
                        viewModel.showSchedulePicker = false
                    }

                    PrimaryButton("Confirm Schedule") {
                        viewModel.confirmSchedule()
                    }
                }
                .padding(.horizontal, Spacing.lg)
                .padding(.bottom, Spacing.lg)
            }
            .background(Color.adaptiveBackground(colorScheme))
        }
    }
}

// MARK: - Supporting Types
struct ToolbarButton {
    var icon: String?
    var text: String?
    var isBold: Bool = false
    var isItalic: Bool = false
    var action: () -> Void
}

enum ContentViewType {
    case mobile, desktop
}

#Preview {
    SmartAIEditorHookScorerView(viewModel: SmartAIEditorHookScorerViewModel())
}
