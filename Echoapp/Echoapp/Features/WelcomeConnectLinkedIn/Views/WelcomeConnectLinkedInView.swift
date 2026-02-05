//
//  WelcomeConnectLinkedInView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct WelcomeConnectLinkedInView: View {
    @ObservedObject var viewModel: WelcomeConnectLinkedInViewModel
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        ZStack {
            Color.adaptiveBackground(colorScheme)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                Spacer()
                
                // App Logo/Icon
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color.appPrimary.opacity(0.2), Color.appPrimary.opacity(0.05)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 120, height: 120)
                    
                    Image(systemName: "link")
                        .font(.system(size: 50))
                        .foregroundColor(.appPrimary)
                }
                .padding(.bottom, Spacing.xl)
                
                // Headline
                VStack(spacing: Spacing.sm) {
                    Text("Your LinkedIn Voice,")
                        .font(.displayLarge)
                        .fontWeight(.bold)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                    Text("Amplified")
                        .font(.displayLarge)
                        .fontWeight(.bold)
                        .foregroundColor(.appPrimary)
                }
                .padding(.bottom, Spacing.sm)

                // Subtitle
                Text("The AI ghostwriter for elite founders and industry experts")
                    .font(.body)
                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, Spacing.xl)
                    .padding(.bottom, Spacing.xxl)
                
                Spacer()
                
                // Buttons
                VStack(spacing: Spacing.md) {
                    PrimaryButton("Connect LinkedIn", icon: "link") {
                        viewModel.connectLinkedIn()
                    }
                    .padding(.horizontal, Spacing.lg)

                    // Error message
                    if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                            .font(.caption)
                            .foregroundColor(.errorRed)
                            .padding(.horizontal, Spacing.lg)
                            .multilineTextAlignment(.center)
                    }

                    // Safety info
                    HStack(spacing: Spacing.sm) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.appPrimary)
                            .font(.callout)

                        Text("Official LinkedIn OAuth • 100% Safe")
                            .font(.footnote)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                    }
                    .padding(.vertical, Spacing.sm)
                    .padding(.horizontal, Spacing.md)
                    .background(Color.adaptiveSecondaryBackground(colorScheme))
                    .cornerRadius(CornerRadius.medium)
                    .overlay(
                        RoundedRectangle(cornerRadius: CornerRadius.medium)
                            .stroke(Color.accentCyan.opacity(0.3), lineWidth: 1)
                    )
                    .padding(.horizontal, Spacing.lg)
                }
                .padding(.bottom, Spacing.xl)
            }
        }
    }
}

#Preview {
    WelcomeConnectLinkedInView(viewModel: WelcomeConnectLinkedInViewModel())
}
