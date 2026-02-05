//
//  ATTRequestView.swift
//  Kuil
//
//  Pre-permission screen shown before iOS ATT dialog
//

import SwiftUI
import AppTrackingTransparency

struct ATTRequestView: View {
    @StateObject private var attService = ATTService.shared
    @State private var isRequesting = false

    var onComplete: () -> Void

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [
                    Color(hex: "0A0A0F"),
                    Color(hex: "1A1A2E")
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 32) {
                Spacer()

                // Icon
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color(hex: "6366F1").opacity(0.3),
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
                                colors: [Color(hex: "6366F1"), Color(hex: "8B5CF6")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                }
                .padding(.bottom, 8)

                // Title
                VStack(spacing: 12) {
                    Text("Personalize Your Experience")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)

                    Text("Allow Kuil to use your data for a better, personalized experience")
                        .font(.system(size: 16))
                        .foregroundColor(.white.opacity(0.7))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }

                // Benefits list
                VStack(alignment: .leading, spacing: 16) {
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
                .padding(.horizontal, 24)
                .padding(.vertical, 24)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.white.opacity(0.05))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(Color.white.opacity(0.1), lineWidth: 1)
                        )
                )
                .padding(.horizontal, 20)

                Spacer()

                // Buttons
                VStack(spacing: 12) {
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
                                    .font(.system(size: 17, weight: .semibold))
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(
                            LinearGradient(
                                colors: [Color(hex: "6366F1"), Color(hex: "8B5CF6")],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .foregroundColor(.white)
                        .cornerRadius(14)
                    }
                    .disabled(isRequesting)

                    // Skip button
                    Button(action: {
                        skipTracking()
                    }) {
                        Text("Not Now")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundColor(.white.opacity(0.6))
                    }
                    .disabled(isRequesting)
                    .padding(.top, 4)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 40)
            }
        }
    }

    @ViewBuilder
    private func benefitRow(icon: String, title: String, description: String) -> some View {
        HStack(alignment: .top, spacing: 16) {
            ZStack {
                Circle()
                    .fill(Color(hex: "6366F1").opacity(0.2))
                    .frame(width: 40, height: 40)

                Image(systemName: icon)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(Color(hex: "6366F1"))
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)

                Text(description)
                    .font(.system(size: 14))
                    .foregroundColor(.white.opacity(0.6))
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
