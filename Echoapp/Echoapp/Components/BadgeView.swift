//
//  BadgeView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct BadgeView: View {
    let text: String
    let color: Color
    
    init(_ text: String, color: Color = .accentBlue) {
        self.text = text
        self.color = color
    }
    
    var body: some View {
        Text(text)
            .font(.caption)
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .padding(.horizontal, Spacing.sm)
            .padding(.vertical, 4)
            .background(color)
            .cornerRadius(CornerRadius.small)
    }
}

#Preview {
    HStack(spacing: 8) {
        BadgeView("AI TREND")
        BadgeView("AUTH", color: .accentLightBlue)
        BadgeView("TRENDING", color: .successGreen)
    }
    .padding()
    .background(Color.appBackground)
}
