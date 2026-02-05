//
//  ToneCalibrationCompletionView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct ToneCalibrationCompletionView: View {
    @Binding var showRoleSelection: Bool
    @Environment(\.colorScheme) var colorScheme
    @State private var scaleAnimation = false
    @State private var checkmarkScale = false
    @State private var confettiOpacity = 0.0

    var body: some View {
        ZStack {
            // Modern gradient background
            LinearGradient(
                colors: [
                    Color.adaptiveBackground(colorScheme),
                    Color.appPrimary.opacity(0.1),
                    Color.adaptiveBackground(colorScheme)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: Spacing.xl) {
                Spacer()

                // Success icon with animation
                ZStack {
                    // Glow circles
                    ForEach(0..<3) { index in
                        Circle()
                            .stroke(Color.appPrimary.opacity(0.3), lineWidth: 2)
                            .frame(width: 120 + CGFloat(index * 30), height: 120 + CGFloat(index * 30))
                            .scaleEffect(scaleAnimation ? 1.0 : 0.5)
                            .opacity(scaleAnimation ? 0.0 : 0.8)
                            .animation(
                                .easeOut(duration: 1.5)
                                .repeatForever(autoreverses: false)
                                .delay(Double(index) * 0.3),
                                value: scaleAnimation
                            )
                    }

                    // Main circle
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color.appPrimary, Color.accentCyan],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 120, height: 120)
                        .shadow(color: Color.appPrimary.opacity(0.5), radius: 30)
                        .scaleEffect(checkmarkScale ? 1.0 : 0.5)

                    // Checkmark
                    Image(systemName: "checkmark")
                        .font(.system(size: 50, weight: .bold))
                        .foregroundColor(.white)
                        .scaleEffect(checkmarkScale ? 1.0 : 0.3)
                }
                .padding(.bottom, Spacing.lg)

                // Title
                VStack(spacing: Spacing.sm) {
                    Text("Calibration Complete!")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                    Text("Your voice profile has been created")
                        .font(.body)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, Spacing.xl)

                // Stats cards
                HStack(spacing: Spacing.md) {
                    statCard(
                        icon: "chart.line.uptrend.xyaxis",
                        title: "12 Posts",
                        subtitle: "Analyzed"
                    )

                    statCard(
                        icon: "sparkles",
                        title: "AI Trained",
                        subtitle: "On your tone"
                    )

                    statCard(
                        icon: "brain.head.profile",
                        title: "Profile",
                        subtitle: "Ready"
                    )
                }
                .padding(.horizontal, Spacing.lg)
                .padding(.top, Spacing.lg)

                Spacer()

                // Continue button
                Button(action: {
                    withAnimation(.appBouncy) {
                        showRoleSelection = true
                    }
                }) {
                    HStack(spacing: Spacing.sm) {
                        Text("Continue")
                            .font(.headline)
                            .fontWeight(.semibold)

                        Image(systemName: "arrow.right")
                            .font(.headline)
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(
                        LinearGradient(
                            colors: [Color.appPrimary, Color.accentCyan],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(CornerRadius.medium)
                    .shadow(color: Color.appPrimary.opacity(0.4), radius: 20, x: 0, y: 10)
                }
                .padding(.horizontal, Spacing.lg)
                .padding(.bottom, Spacing.xl)
            }
        }
        .onAppear {
            withAnimation(.appBouncy.delay(0.2)) {
                checkmarkScale = true
            }
            scaleAnimation = true
        }
    }

    private func statCard(icon: String, title: String, subtitle: String) -> some View {
        VStack(spacing: Spacing.sm) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.accentCyan)

            Text(title)
                .font(.callout)
                .fontWeight(.semibold)
                .foregroundColor(Color.adaptivePrimaryText(colorScheme))

            Text(subtitle)
                .font(.caption)
                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Spacing.lg)
        .background(Color.adaptiveSecondaryBackground(colorScheme))
        .cornerRadius(CornerRadius.medium)
    }
}

#Preview {
    ToneCalibrationCompletionView(showRoleSelection: .constant(false))
}
