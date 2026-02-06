//
//  SplashScreenView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 23/01/2026.
//

import SwiftUI

// MARK: - Kuil Logo Shape (from SVG path)
struct KuilLogoShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()

        // Original SVG viewBox: 0 0 1220 1220
        let scale = min(rect.width, rect.height) / 1220

        // Transform helper
        func pt(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
            CGPoint(x: x * scale + rect.minX, y: y * scale + rect.minY)
        }

        // SVG Path converted to SwiftUI
        path.move(to: pt(1113.12, 106.862))

        // First curve section
        path.addCurve(to: pt(512.002, 168.161),
                      control1: pt(964.09, -42.0272),
                      control2: pt(727.914, -47.4978))

        path.addCurve(to: pt(307.687, 372.283),
                      control1: pt(324.69, 355.268),
                      control2: pt(366.683, 313.339))

        path.addCurve(to: pt(156.037, 875.48),
                      control1: pt(163.613, 516.202),
                      control2: pt(139.946, 731.651))

        path.addLine(to: pt(581.22, 450.747))

        path.addCurve(to: pt(635.196, 450.747),
                      control1: pt(596.119, 435.848),
                      control2: pt(620.298, 435.848))

        path.addCurve(to: pt(635.196, 504.673),
                      control1: pt(650.095, 465.646),
                      control2: pt(650.095, 489.775))

        path.addLine(to: pt(16.7799, 1122.39))

        path.addCurve(to: pt(16.7799, 1203.26),
                      control1: pt(-5.5933, 1144.72),
                      control2: pt(-5.5933, 1180.93))

        path.addCurve(to: pt(97.7445, 1203.26),
                      control1: pt(39.1531, 1225.58),
                      control2: pt(75.3712, 1225.58))

        path.addLine(to: pt(255.264, 1045.94))

        path.addCurve(to: pt(843.386, 915.021),
                      control1: pt(379.87, 1083.37),
                      control2: pt(664.806, 1089.24))

        path.addLine(to: pt(609.418, 915.021))
        path.addLine(to: pt(961.069, 797.939))

        path.addCurve(to: pt(1071.43, 686.275),
                      control1: pt(1080.21, 678.951),
                      control2: pt(1047.75, 711.708))

        path.addLine(to: pt(838.413, 686.275))
        path.addLine(to: pt(1151.83, 581.935))

        path.addCurve(to: pt(1113.11, 106.887),
                      control1: pt(1260.14, 404.511),
                      control2: pt(1233.6, 227.28))

        path.closeSubpath()

        return path
    }
}

struct SplashScreenView: View {
    @Environment(\.colorScheme) var colorScheme
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
            Color.adaptiveBackground(colorScheme)
                .ignoresSafeArea()

            // Subtle gradient overlay
            LinearGradient(
                colors: [
                    Color.adaptiveSecondaryBackground(colorScheme).opacity(0.3),
                    Color.clear,
                    Color.adaptiveSecondaryBackground(colorScheme).opacity(0.2)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            // Animated particles/dots in background
            ForEach(0..<12, id: \.self) { index in
                Circle()
                    .fill(Color.appPrimary.opacity(0.1))
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

                        // Kuil logo shape (real logo from SVG)
                        KuilLogoShape()
                            .fill(Color.white)
                            .frame(width: 55, height: 55)
                    }
                    .scaleEffect(logoScale)
                    .opacity(logoOpacity)
                }

                // App name
                VStack(spacing: Spacing.xs) {
                    Text("Kuil")
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                    Text("Your LinkedIn Voice")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
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
