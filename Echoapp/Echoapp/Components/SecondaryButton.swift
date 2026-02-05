//
//  SecondaryButton.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct SecondaryButton: View {
    let title: String
    let action: () -> Void
    
    init(_ title: String, action: @escaping () -> Void) {
        self.title = title
        self.action = action
    }
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.headline)
                .foregroundColor(.appPrimary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.md)
                .background(Color.clear)
                .overlay(
                    RoundedRectangle(cornerRadius: CornerRadius.medium)
                        .stroke(Color.appPrimary, lineWidth: 1)
                )
        }
        .buttonStyle(ScaleButtonStyle())
    }
}

#Preview {
    SecondaryButton("Skip", action: {})
        .padding()
        .background(Color.appBackground)
}
