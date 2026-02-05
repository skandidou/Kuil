//
//  CardView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct CardView<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
            .padding(Spacing.md)
            .background(Color.appSecondaryBackground)
            .cornerRadius(CornerRadius.medium)
    }
}

#Preview {
    CardView {
        Text("Card Content")
            .foregroundColor(.primaryText)
    }
    .padding()
    .background(Color.appBackground)
}
