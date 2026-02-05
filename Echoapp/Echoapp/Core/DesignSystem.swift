//
//  DesignSystem.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

// MARK: - Colors
extension Color {
    // DARK MODE COLORS (original)
    private static let appBackgroundDark = Color(hex: "0A0B0F")
    private static let appSecondaryBackgroundDark = Color(hex: "1A1B1F")
    private static let primaryTextDark = Color.white
    private static let secondaryTextDark = Color(red: 0.7, green: 0.7, blue: 0.7)
    private static let tertiaryTextDark = Color(red: 0.5, green: 0.5, blue: 0.5)

    // LIGHT MODE COLORS (new)
    private static let appBackgroundLight = Color(hex: "FFFFFF")
    private static let appSecondaryBackgroundLight = Color(hex: "F5F5F5")
    private static let primaryTextLight = Color(hex: "1A1B1F")
    private static let secondaryTextLight = Color(hex: "4A4A4A")
    private static let tertiaryTextLight = Color(hex: "8A8A8A")

    // ADAPTIVE COLORS (respond to colorScheme)
    static func adaptiveBackground(_ colorScheme: ColorScheme) -> Color {
        colorScheme == .light ? appBackgroundLight : appBackgroundDark
    }

    static func adaptiveSecondaryBackground(_ colorScheme: ColorScheme) -> Color {
        colorScheme == .light ? appSecondaryBackgroundLight : appSecondaryBackgroundDark
    }

    static func adaptivePrimaryText(_ colorScheme: ColorScheme) -> Color {
        colorScheme == .light ? primaryTextLight : primaryTextDark
    }

    static func adaptiveSecondaryText(_ colorScheme: ColorScheme) -> Color {
        colorScheme == .light ? secondaryTextLight : secondaryTextDark
    }

    static func adaptiveTertiaryText(_ colorScheme: ColorScheme) -> Color {
        colorScheme == .light ? tertiaryTextLight : tertiaryTextDark
    }

    // BACKWARD COMPATIBILITY (for gradual migration)
    static let appPrimary = Color(hex: "4540E2") // Kuil Violet - brand color
    static let appBackground = appBackgroundDark // Default to dark for non-migrated views
    static let appSecondaryBackground = appSecondaryBackgroundDark
    static let primaryText = primaryTextDark
    static let secondaryText = secondaryTextDark
    static let tertiaryText = tertiaryTextDark

    // Accent Colors (work in both modes)
    static let kuilViolet = Color(hex: "4540E2") // Brand primary
    static let accentBlue = Color(hex: "0066FF")
    static let accentCyan = Color(hex: "00D9FF")
    static let accentTeal = Color(hex: "1DE9B6")
    static let accentLightBlue = Color(hex: "66B3FF")
    static let successGreen = Color(hex: "33CC66")
    static let warningYellow = Color(hex: "FFA500")
    static let errorRed = Color(hex: "FF4D4D")
}

// MARK: - Color Hex Initializer
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6: // RGB
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Typography
extension Font {
    // Display Typography (for large headlines)
    static let displayLarge = Font.system(size: 32, weight: .bold, design: .default)
    static let displayMedium = Font.system(size: 28, weight: .bold, design: .default)
    static let displaySmall = Font.system(size: 25, weight: .bold, design: .default)

    // Standard Typography
    static let largeTitle = Font.system(size: 34, weight: .bold, design: .default)
    static let title1 = Font.system(size: 28, weight: .bold, design: .default)
    static let title2 = Font.system(size: 22, weight: .semibold, design: .default)
    static let title3 = Font.system(size: 20, weight: .semibold, design: .default)
    static let headline = Font.system(size: 17, weight: .semibold, design: .default)
    static let body = Font.system(size: 17, weight: .regular, design: .default)
    static let callout = Font.system(size: 16, weight: .regular, design: .default)
    static let subheadline = Font.system(size: 15, weight: .regular, design: .default)
    static let footnote = Font.system(size: 13, weight: .regular, design: .default)
    static let caption = Font.system(size: 12, weight: .regular, design: .default)
    static let caption2 = Font.system(size: 11, weight: .regular, design: .default)
}

// MARK: - Spacing
struct Spacing {
    static let xxs: CGFloat = 2   // For tight spacing
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
    static let xxl: CGFloat = 48
    static let xxxl: CGFloat = 64
    static let jumbo: CGFloat = 80 // For major section breaks
}

// MARK: - Corner Radius
struct CornerRadius {
    static let small: CGFloat = 8
    static let medium: CGFloat = 12
    static let large: CGFloat = 16
    static let xlarge: CGFloat = 24
}

// MARK: - Shadow
extension View {
    func cardShadow() -> some View {
        self.shadow(color: Color.black.opacity(0.3), radius: 8, x: 0, y: 4)
    }
}
