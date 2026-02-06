//
//  ToneCalibrationSwipeFlowView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import UIKit

struct ToneCalibrationSwipeFlowView: View {
    @ObservedObject var viewModel: ToneCalibrationSwipeFlowViewModel
    @Environment(\.colorScheme) var colorScheme
    let isOnboarding: Bool

    @State private var dragOffset: CGSize = .zero
    @State private var rotation: Double = 0
    @State private var opacity: Double = 1.0
    @State private var scale: CGFloat = 1.0
    @State private var cardAppeared = false
    @State private var pulseAnimation = false
    @State private var showCompletion = false
    @State private var showRoleSelection = false

    init(viewModel: ToneCalibrationSwipeFlowViewModel, isOnboarding: Bool = false) {
        self.viewModel = viewModel
        self.isOnboarding = isOnboarding
    }

    var body: some View {
        ZStack {
            // Show completion screen or role selection if calibration is done
            if showRoleSelection {
                UserRoleSelectionView()
            } else if showCompletion {
                ToneCalibrationCompletionView(showRoleSelection: $showRoleSelection)
            } else {
                // Main calibration flow
                calibrationView
            }
        }
        .onAppear {
            // Only start generating calibration posts when the view actually appears
            // This prevents wasting an expensive Opus API call if onboarding is already done
            viewModel.startIfNeeded()
        }
        .onChange(of: viewModel.isCompleted) { _, newValue in
            if newValue {
                withAnimation(.appBouncy) {
                    showCompletion = true
                }
            }
        }
    }

    private var calibrationView: some View {
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
                // Modern header
                headerView
                    .padding(.horizontal, Spacing.lg)
                    .padding(.top, Spacing.lg)

                if !isOnboarding {
                    progressView
                        .padding(.horizontal, Spacing.lg)
                        .padding(.top, Spacing.lg)
                }

                Spacer()

                // Beautiful card stack effect
                ZStack {
                    // Background cards for depth
                    ForEach(0..<2) { index in
                        backgroundCard(index: index)
                    }

                    // Main interactive card
                    mainCardView
                }
                .frame(maxHeight: 500)
                .padding(.horizontal, Spacing.lg)

                Spacer()

                // Modern action buttons
                actionButtonsView
                    .padding(.horizontal, Spacing.lg)
                    .padding(.bottom, Spacing.xl)

                // Elegant instruction text
                if dragOffset == .zero {
                    instructionText
                        .padding(.bottom, Spacing.lg)
                        .transition(.opacity)
                }
            }
        }
        .onAppear {
            withAnimation(.appBouncy.delay(0.2)) {
                cardAppeared = true
            }
            withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true)) {
                pulseAnimation = true
            }
        }
    }

    // MARK: - Header
    private var headerView: some View {
        HStack(alignment: .center) {
            if !isOnboarding {
                closeButton
            } else {
                Spacer().frame(width: 44)
            }

            VStack(spacing: 6) {
                Text("Voice Calibration")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                HStack(spacing: 4) {
                    Circle()
                        .fill(Color.appPrimary)
                        .frame(width: 6, height: 6)
                        .scaleEffect(pulseAnimation ? 1.3 : 1.0)

                    Text(isOnboarding ? "Find Your Tone" : "TRAINING AI")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.accentCyan)
                        .textCase(.uppercase)
                }
            }
            .frame(maxWidth: .infinity)

            if !isOnboarding {
                undoButton
            } else {
                Spacer().frame(width: 44)
            }
        }
    }

    private var closeButton: some View {
        Button(action: { viewModel.cancel() }) {
            Image(systemName: "xmark")
                .font(.headline)
                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                .frame(width: 44, height: 44)
                .background(Color.adaptiveSecondaryBackground(colorScheme))
                .clipShape(Circle())
        }
    }

    private var undoButton: some View {
        Button(action: { viewModel.undo() }) {
            Image(systemName: "arrow.uturn.backward")
                .font(.headline)
                .foregroundColor(.accentCyan)
                .frame(width: 44, height: 44)
                .background(Color.accentCyan.opacity(0.15))
                .clipShape(Circle())
        }
    }

    // MARK: - Progress
    private var progressView: some View {
        VStack(spacing: Spacing.sm) {
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    // Background track
                    Capsule()
                        .fill(Color.adaptiveSecondaryBackground(colorScheme))
                        .frame(height: 8)

                    // Progress with gradient
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [Color.appPrimary, Color.accentCyan],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geometry.size.width * viewModel.progress, height: 8)
                        .animation(.appDefault, value: viewModel.progress)

                    // Glowing effect
                    Capsule()
                        .fill(Color.appPrimary.opacity(0.5))
                        .frame(width: geometry.size.width * viewModel.progress, height: 8)
                        .blur(radius: 4)
                        .animation(.appDefault, value: viewModel.progress)
                }
            }
            .frame(height: 8)

            HStack {
                Text("Calibrating your voice")
                    .font(.caption)
                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                Spacer()
                Text("\(viewModel.currentStep)/\(viewModel.totalSteps)")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.accentCyan)
            }
        }
    }

    // MARK: - Cards
    private func backgroundCard(index: Int) -> some View {
        let offset: CGFloat = CGFloat(index + 1) * 8
        let scale: CGFloat = 1.0 - (CGFloat(index + 1) * 0.04)

        return RoundedRectangle(cornerRadius: CornerRadius.large + 4)
            .fill(Color.adaptiveSecondaryBackground(colorScheme).opacity(0.3))
            .frame(height: 400)
            .scaleEffect(scale)
            .offset(y: offset)
            .blur(radius: CGFloat(index + 1) * 2)
    }

    private var mainCardView: some View {
        Group {
            if viewModel.isLoading {
                // Loading state with explanation
                VStack(spacing: 24) {
                    // Animated icon
                    ZStack {
                        Circle()
                            .stroke(Color.accentCyan.opacity(0.2), lineWidth: 4)
                            .frame(width: 80, height: 80)

                        Circle()
                            .trim(from: 0, to: 0.7)
                            .stroke(
                                LinearGradient(
                                    colors: [Color.appPrimary, Color.accentCyan],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                style: StrokeStyle(lineWidth: 4, lineCap: .round)
                            )
                            .frame(width: 80, height: 80)
                            .rotationEffect(.degrees(pulseAnimation ? 360 : 0))
                            .animation(.linear(duration: 1.5).repeatForever(autoreverses: false), value: pulseAnimation)

                        Image(systemName: "wand.and.stars")
                            .font(.system(size: 28))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [Color.appPrimary, Color.accentCyan],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                    }

                    VStack(spacing: 12) {
                        Text("Creating your personalized posts...")
                            .font(.headline)
                            .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                        Text("Our AI is crafting unique content samples\nto learn your authentic voice.")
                            .font(.subheadline)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                            .multilineTextAlignment(.center)
                            .lineSpacing(4)

                        // Subtle hint about wait time
                        HStack(spacing: 6) {
                            Image(systemName: "sparkles")
                                .font(.caption)
                            Text("This may take 15-30 seconds")
                                .font(.caption)
                        }
                        .foregroundColor(Color.accentCyan.opacity(0.8))
                        .padding(.top, 8)
                    }
                }
                .frame(height: 400)
                .frame(maxWidth: .infinity)
                .background(
                    RoundedRectangle(cornerRadius: CornerRadius.large + 4)
                        .fill(Color.adaptiveSecondaryBackground(colorScheme))
                )
            } else if let currentQuote = viewModel.currentQuote, !currentQuote.isEmpty {
                ZStack {
                    // Modern card with glass morphism effect
                    VStack(alignment: .leading, spacing: Spacing.lg) {
                        // Tone badge with icon
                        HStack(spacing: Spacing.xs) {
                            Image(systemName: "sparkles")
                                .font(.caption)
                            Text(viewModel.toneBadge.uppercased())
                                .font(.caption)
                                .fontWeight(.bold)
                        }
                        .foregroundColor(.accentCyan)
                        .padding(.horizontal, Spacing.md)
                        .padding(.vertical, Spacing.sm)
                        .background(Color.accentCyan.opacity(0.15))
                        .cornerRadius(CornerRadius.small)

                        // Quote text with scrolling for long content
                        ScrollView(.vertical, showsIndicators: false) {
                            Text(currentQuote)
                                .font(.body)
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                                .lineSpacing(8)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        // Question prompt with icon
                        HStack(spacing: Spacing.sm) {
                            Image(systemName: "questionmark.circle.fill")
                                .font(.callout)
                                .foregroundColor(.accentCyan)

                            Text("Does this sound like you?")
                                .font(.callout)
                                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                        }
                        .padding(.top, Spacing.md)
                    }
                    .padding(Spacing.xl)
                    .frame(maxWidth: .infinity)
                    .frame(height: 400)
                    .background(
                        ZStack {
                            // Glass morphism background
                            RoundedRectangle(cornerRadius: CornerRadius.large + 4)
                                .fill(Color.adaptiveSecondaryBackground(colorScheme))

                            // Subtle gradient overlay
                            RoundedRectangle(cornerRadius: CornerRadius.large + 4)
                                .fill(
                                    LinearGradient(
                                        colors: [
                                            Color.appPrimary.opacity(0.05),
                                            Color.clear
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )

                            // Border glow
                            RoundedRectangle(cornerRadius: CornerRadius.large + 4)
                                .stroke(
                                    LinearGradient(
                                        colors: [
                                            Color.accentCyan.opacity(0.3),
                                            Color.appPrimary.opacity(0.3)
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ),
                                    lineWidth: 1
                                )
                        }
                    )
                    .shadow(color: Color.black.opacity(0.15), radius: 20, x: 0, y: 10)
                    .offset(dragOffset)
                    .rotationEffect(.degrees(rotation))
                    .opacity(opacity)
                    .scaleEffect(scale * (cardAppeared ? 1.0 : 0.8))
                    .gesture(swipeGesture)

                    // Swipe direction indicators
                    swipeIndicators
                }
            } else {
                // Error state - retry button
                VStack(spacing: 20) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 50))
                        .foregroundColor(.orange)

                    Text("Failed to load posts")
                        .font(.headline)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                    Text("Please try again")
                        .font(.subheadline)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))

                    Button(action: {
                        Task {
                            await viewModel.generateAIPosts()
                        }
                    }) {
                        HStack {
                            Image(systemName: "arrow.clockwise")
                            Text("Retry")
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding(.horizontal, 30)
                        .padding(.vertical, 12)
                        .background(Color.appPrimary)
                        .cornerRadius(10)
                    }
                }
                .frame(height: 400)
                .frame(maxWidth: .infinity)
                .background(
                    RoundedRectangle(cornerRadius: CornerRadius.large + 4)
                        .fill(Color.adaptiveSecondaryBackground(colorScheme))
                )
            }
        }
    }

    private var swipeIndicators: some View {
        Group {
            if abs(dragOffset.width) > 30 {
                VStack {
                    Spacer()

                    HStack {
                        if dragOffset.width < 0 {
                            // Skip indicator (left)
                            swipeIndicatorView(
                                icon: "xmark",
                                text: "SKIP",
                                color: .errorRed,
                                alignment: .leading
                            )
                            Spacer()
                        } else {
                            Spacer()
                            // Accept indicator (right)
                            swipeIndicatorView(
                                icon: "checkmark",
                                text: "YES",
                                color: .successGreen,
                                alignment: .trailing
                            )
                        }
                    }

                    Spacer()
                }
                .padding(.horizontal, Spacing.xl)
            }
        }
    }

    private func swipeIndicatorView(icon: String, text: String, color: Color, alignment: HorizontalAlignment) -> some View {
        let dragProgress = min(1.0, Double(abs(dragOffset.width) / 60.0))
        let indicatorScale = 0.8 + (dragProgress * 0.2)

        return VStack(spacing: Spacing.sm) {
            ZStack {
                Circle()
                    .fill(color)
                    .frame(width: 60, height: 60)
                    .shadow(color: color.opacity(0.4), radius: 12, x: 0, y: 4)

                Image(systemName: icon)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(.white)
            }

            Text(text)
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(color)
                .tracking(1.5)
        }
        .opacity(dragProgress)
        .scaleEffect(indicatorScale)
        .animation(.appQuick, value: dragOffset.width)
    }

    // MARK: - Action Buttons
    private var actionButtonsView: some View {
        HStack(spacing: Spacing.xl) {
            // Skip button
            Button(action: skipAction) {
                ZStack {
                    Circle()
                        .fill(Color.errorRed.opacity(0.12))
                        .frame(width: 60, height: 60)

                    Image(systemName: "xmark")
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(.errorRed)
                }
            }
            .buttonStyle(ModernButtonStyle())

            Spacer()

            // Info button (if not onboarding)
            if !isOnboarding {
                Button(action: { viewModel.showInfo() }) {
                    ZStack {
                        Circle()
                            .fill(Color.adaptiveSecondaryBackground(colorScheme))
                            .frame(width: 44, height: 44)

                        Image(systemName: "info.circle")
                            .font(.callout)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                    }
                }
                .buttonStyle(ModernButtonStyle())
            }

            Spacer()

            // Accept button
            Button(action: acceptAction) {
                ZStack {
                    Circle()
                        .fill(Color.appPrimary)
                        .frame(width: 60, height: 60)
                        .shadow(color: Color.appPrimary.opacity(0.3), radius: 12)

                    Image(systemName: "checkmark")
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                }
            }
            .buttonStyle(ModernButtonStyle())
        }
    }

    private var instructionText: some View {
        HStack(spacing: Spacing.xs) {
            Image(systemName: "hand.draw")
                .font(.caption)
            Text("Swipe or tap buttons")
                .font(.caption)
                .fontWeight(.medium)
        }
        .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
    }

    // MARK: - Haptic Feedback
    private func triggerHaptic(_ style: UIImpactFeedbackGenerator.FeedbackStyle) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.impactOccurred()
    }

    private func triggerSuccessHaptic() {
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)
    }

    // MARK: - Gesture
    private var swipeGesture: some Gesture {
        DragGesture()
            .onChanged { value in
                dragOffset = value.translation
                rotation = Double(value.translation.width / 18.0) // Slightly less rotation
                let dragDistance = sqrt(pow(value.translation.width, 2) + pow(value.translation.height, 2))
                opacity = Double(max(0.6, 1.0 - dragDistance / 400.0))
                scale = max(0.95, 1.0 - abs(value.translation.width) / 1200.0)

                // Light haptic when crossing threshold
                if abs(value.translation.width) > 80 && abs(value.translation.width) < 85 {
                    triggerHaptic(.light)
                }
            }
            .onEnded { value in
                let swipeThreshold: CGFloat = 80.0 // Reduced from 120 for easier swipe

                if abs(value.translation.width) > swipeThreshold {
                    let swipeDirection: CGFloat = value.translation.width > 0 ? 1.0 : -1.0

                    // Strong haptic feedback on successful swipe
                    triggerSuccessHaptic()

                    withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
                        dragOffset = CGSize(
                            width: swipeDirection * 1000.0,
                            height: value.translation.height * 0.4 // Smoother curve
                        )
                        rotation = Double(swipeDirection * 35.0) // Less extreme rotation
                        opacity = 0
                        scale = 0.85
                    }

                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                        if swipeDirection > 0 {
                            viewModel.accept()
                        } else {
                            viewModel.skip()
                        }
                        resetCard()
                    }
                } else {
                    // Soft haptic when snapping back
                    triggerHaptic(.soft)
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                        resetCard()
                    }
                }
            }
    }

    // MARK: - Actions
    private func skipAction() {
        triggerSuccessHaptic()

        withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
            dragOffset = CGSize(width: -1000.0, height: -100)
            rotation = -35.0
            opacity = 0
            scale = 0.85
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
            viewModel.skip()
            resetCard()
        }
    }

    private func acceptAction() {
        triggerSuccessHaptic()

        withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
            dragOffset = CGSize(width: 1000.0, height: -100)
            rotation = 35.0
            opacity = 0
            scale = 0.85
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
            viewModel.accept()
            resetCard()
        }
    }

    private func resetCard() {
        dragOffset = .zero
        rotation = 0
        opacity = 1.0
        scale = 1.0
        cardAppeared = false

        withAnimation(.appBouncy.delay(0.1)) {
            cardAppeared = true
        }
    }
}

// MARK: - Modern Button Style
struct ModernButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.92 : 1.0)
            .opacity(configuration.isPressed ? 0.8 : 1.0)
            .animation(.appSubtle, value: configuration.isPressed)
    }
}

#Preview {
    ToneCalibrationSwipeFlowView(
        viewModel: ToneCalibrationSwipeFlowViewModel(isOnboarding: true),
        isOnboarding: true
    )
}
