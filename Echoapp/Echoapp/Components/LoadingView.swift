//
//  LoadingView.swift
//  Kuil
//
//  Shared loading component for consistent loading states across the app
//

import SwiftUI

struct LoadingView: View {
    let title: String
    let subtitle: String?
    @Environment(\.colorScheme) var colorScheme
    @State private var isAnimating = false

    init(_ title: String = "Loading...", subtitle: String? = nil) {
        self.title = title
        self.subtitle = subtitle
    }

    var body: some View {
        VStack(spacing: Spacing.lg) {
            ZStack {
                Circle()
                    .stroke(Color.appPrimary.opacity(0.15), lineWidth: 3)
                    .frame(width: 64, height: 64)

                Circle()
                    .trim(from: 0, to: 0.65)
                    .stroke(
                        LinearGradient(
                            colors: [Color.appPrimary, Color.accentCyan],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        style: StrokeStyle(lineWidth: 3, lineCap: .round)
                    )
                    .frame(width: 64, height: 64)
                    .rotationEffect(.degrees(isAnimating ? 360 : 0))
                    .animation(.linear(duration: 1.2).repeatForever(autoreverses: false), value: isAnimating)
            }

            VStack(spacing: Spacing.xs) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                        .multilineTextAlignment(.center)
                }
            }
        }
        .onAppear {
            isAnimating = true
        }
    }
}

#Preview {
    VStack(spacing: 40) {
        LoadingView("Analyzing your profile...", subtitle: "Discovering your unique voice")
        LoadingView()
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color.appBackground)
}
