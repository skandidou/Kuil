//
//  ATTRequestView.swift
//  Kuil
//
//  Pre-permission screen shown before iOS ATT dialog
//

import SwiftUI
import AppTrackingTransparency

struct ATTRequestView: View {
    @Environment(\.colorScheme) var colorScheme
    @StateObject private var attService = ATTService.shared
    @State private var isRequesting = false

    var onComplete: () -> Void

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [
                    Color.adaptiveBackground(colorScheme),
                    Color.adaptiveSecondaryBackground(colorScheme)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: Spacing.xl) {
                Spacer()

                // Icon
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color.appPrimary.opacity(0.3),
                                    Color(hex: "8B5CF6").opacity(0.1)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 120, height: 120)

                    Image(systemName: "chart.bar.doc.horizontal")
                        .font(.system(size: 48, weight: .medium))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color.appPrimary, Color(hex: "8B5CF6")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                }
                .padding(.bottom, Spacing.sm)

                // Title
                VStack(spacing: Spacing.md) {
                    Text("Personalize Your Experience")
                        .font(.displayMedium)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                        .multilineTextAlignment(.center)

                    Text("Allow Kuil to use your data for a better, personalized experience")
                        .font(.callout)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, Spacing.lg)
                }

                // Benefits list
                VStack(alignment: .leading, spacing: Spacing.md) {
                    benefitRow(
                        icon: "sparkles",
                        title: "Smarter AI Suggestions",
                        description: "Content tailored to your industry"
                    )

                    benefitRow(
                        icon: "clock.arrow.circlepath",
                        title: "Optimal Posting Times",
                        description: "Know when your audience is active"
                    )

                    benefitRow(
                        icon: "chart.line.uptrend.xyaxis",
                        title: "Performance Insights",
                        description: "Understand what content works best"
                    )
                }
                .padding(.horizontal, Spacing.lg)
                .padding(.vertical, Spacing.lg)
                .background(
                    RoundedRectangle(cornerRadius: CornerRadius.large)
                        .fill(Color.adaptiveSecondaryBackground(colorScheme))
                        .overlay(
                            RoundedRectangle(cornerRadius: CornerRadius.large)
                                .stroke(Color.adaptiveSeparator(colorScheme), lineWidth: 1)
                        )
                )
                .padding(.horizontal, Spacing.lg)

                Spacer()

                // Buttons
                VStack(spacing: Spacing.md) {
                    // Allow button
                    Button(action: {
                        requestTracking()
                    }) {
                        HStack {
                            if isRequesting {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.8)
                            } else {
                                Text("Continue")
                                    .font(.headline)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(
                            LinearGradient(
                                colors: [Color.appPrimary, Color(hex: "8B5CF6")],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .foregroundColor(.white)
                        .cornerRadius(CornerRadius.medium)
                    }
                    .disabled(isRequesting)

                    // Skip button
                    Button(action: {
                        skipTracking()
                    }) {
                        Text("Not Now")
                            .font(.subheadline).fontWeight(.medium)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                    }
                    .disabled(isRequesting)
                    .padding(.top, Spacing.xs)
                }
                .padding(.horizontal, Spacing.lg)
                .padding(.bottom, Spacing.xxl)
            }
        }
    }

    @ViewBuilder
    private func benefitRow(icon: String, title: String, description: String) -> some View {
        HStack(alignment: .top, spacing: Spacing.md) {
            ZStack {
                Circle()
                    .fill(Color.appPrimary.opacity(0.2))
                    .frame(width: 40, height: 40)

                Image(systemName: icon)
                    .font(.callout).fontWeight(.medium)
                    .foregroundColor(Color.appPrimary)
            }

            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(title)
                    .font(.callout).fontWeight(.semibold)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                Text(description)
                    .font(.footnote)
                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
            }

            Spacer()
        }
    }

    private func requestTracking() {
        isRequesting = true

        Task {
            // Small delay for smooth animation
            try? await Task.sleep(nanoseconds: 300_000_000)

            // Request tracking permission (shows iOS dialog)
            _ = await attService.requestTrackingAuthorization()

            await MainActor.run {
                isRequesting = false
                onComplete()
            }
        }
    }

    private func skipTracking() {
        attService.skipRequest()
        onComplete()
    }
}

#Preview {
    ATTRequestView(onComplete: {})
}
