//
//  AnimatedNumberView.swift
//  Kuil
//
//  Created by Claude on 15/01/2026.
//

import SwiftUI

struct AnimatedNumberView: View {
    let value: Double
    let fontSize: CGFloat
    let fontWeight: Font.Weight
    @State private var displayValue: Double = 0
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        Text("\(Int(displayValue))")
            .font(.system(size: fontSize, weight: fontWeight))
            .foregroundColor(Color.adaptivePrimaryText(colorScheme))
            .onAppear {
                withAnimation(.easeOut(duration: 1.5)) {
                    displayValue = value
                }
            }
            .onChange(of: value) { oldValue, newValue in
                withAnimation(.easeOut(duration: 0.8)) {
                    displayValue = newValue
                }
            }
    }
}

#Preview {
    VStack(spacing: 20) {
        AnimatedNumberView(value: 78, fontSize: 56, fontWeight: .bold)
        AnimatedNumberView(value: 42, fontSize: 64, fontWeight: .bold)
        AnimatedNumberView(value: 85, fontSize: 32, fontWeight: .bold)
    }
    .padding()
    .background(Color.appBackground)
}
