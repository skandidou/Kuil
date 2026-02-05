//
//  SplashScreenView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 23/01/2026.
//

import SwiftUI

struct SplashScreenView: View {
    @State private var logoScale: CGFloat = 0.7
    @State private var logoOpacity: Double = 0
    @State private var textOpacity: Double = 0
    @State private var ringScale: CGFloat = 0.8
    @State private var ringOpacity: Double = 0
    @State private var pulseRing: CGFloat = 1.0
    @State private var glowOpacity: Double = 0

    var body: some View {
        ZStack {
            // SOLID background - must be completely opaque to hide content behind
            Color.appBackground
                .ignoresSafeArea()

            // Subtle gradient overlay
            LinearGradient(
                colors: [
                    Color.appSecondaryBackground.opacity(0.3),
                    Color.clear,
                    Color.appSecondaryBackground.opacity(0.2)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            // Animated particles/dots in background
            ForEach(0..<12, id: \.self) { index in
                Circle()
                    .fill(Color.accentCyan.opacity(0.15))
                    .frame(width: CGFloat.random(in: 4...12))
                    .offset(
                        x: CGFloat.random(in: -150...150),
                        y: CGFloat.random(in: -300...300)
                    )
                    .opacity(glowOpacity * 0.5)
            }

            VStack(spacing: Spacing.xl) {
                Spacer()

                // Logo container
                ZStack {
                    // Outer pulsing ring
                    Circle()
                        .stroke(
                            LinearGradient(
                                colors: [Color.appPrimary.opacity(0.3), Color.accentCyan.opacity(0.3)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 2
                        )
                        .frame(width: 160, height: 160)
                        .scaleEffect(pulseRing)
                        .opacity(ringOpacity * 0.5)

                    // Inner glow ring
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color.appPrimary.opacity(0.2),
                                    Color.accentCyan.opacity(0.1),
                                    Color.clear
                                ],
                                center: .center,
                                startRadius: 30,
                                endRadius: 100
                            )
                        )
                        .frame(width: 200, height: 200)
                        .scaleEffect(ringScale)
                        .opacity(ringOpacity)

                    // Main logo circle
                    ZStack {
                        // Gradient background
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [Color.appPrimary, Color.accentCyan],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 100, height: 100)
                            .shadow(color: Color.appPrimary.opacity(0.5), radius: 30, x: 0, y: 10)

                        // Kuil icon/letter
                        Text("K")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                    }
                    .scaleEffect(logoScale)
                    .opacity(logoOpacity)
                }

                // App name
                VStack(spacing: Spacing.xs) {
                    Text("Kuil")
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                        .foregroundColor(.primaryText)

                    Text("Your LinkedIn Voice")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.secondaryText)
                }
                .opacity(textOpacity)

                Spacer()
                Spacer()
            }
        }
        .onAppear {
            startAnimations()
        }
    }

    private func startAnimations() {
        // Logo entrance
        withAnimation(.spring(response: 0.8, dampingFraction: 0.6).delay(0.1)) {
            logoScale = 1.0
            logoOpacity = 1.0
        }

        // Ring glow
        withAnimation(.easeOut(duration: 0.6).delay(0.2)) {
            ringScale = 1.0
            ringOpacity = 1.0
            glowOpacity = 1.0
        }

        // Text fade in
        withAnimation(.easeOut(duration: 0.5).delay(0.5)) {
            textOpacity = 1.0
        }

        // Continuous pulse animation
        withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true).delay(0.8)) {
            pulseRing = 1.15
        }
    }
}

#Preview {
    SplashScreenView()
}
