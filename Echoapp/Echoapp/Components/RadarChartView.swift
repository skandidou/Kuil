//
//  RadarChartView.swift
//  Kuil
//
//  Created by Claude on 15/01/2026.
//

import SwiftUI

struct RadarChartView: View {
    let dimensions: [String] // ["Formal", "Bold", "Empathetic", "Analytical", "Storytelling"]
    let values: [Double] // Values 0-10 for each dimension
    let maxValue: Double = 10.0
    @State private var animationProgress: Double = 0

    var body: some View {
        GeometryReader { geometry in
            ChartContent(
                dimensions: dimensions,
                values: values,
                maxValue: maxValue,
                animationProgress: animationProgress,
                size: geometry.size
            )
        }
        .onAppear {
            withAnimation(.appDefault.delay(0.2)) {
                animationProgress = 1.0
            }
        }
    }
}

// Separated view to avoid type-checking timeout
private struct ChartContent: View {
    let dimensions: [String]
    let values: [Double]
    let maxValue: Double
    let animationProgress: Double
    let size: CGSize

    private var center: CGPoint {
        CGPoint(x: size.width / 2, y: size.height / 2)
    }

    private var radius: CGFloat {
        min(size.width, size.height) / 2 - 40
    }

    private var normalizedValues: [Double] {
        values.map { $0 / maxValue }
    }

    var body: some View {
        ZStack {
            backgroundGrid
            dataPolygonFilled
            dataPolygonStroked
            dimensionLabels
        }
    }

    private var backgroundGrid: some View {
        ForEach(1..<6) { level in
            RadarPolygon(sides: 5, scale: Double(level) / 5.0)
                .stroke(Color.appSecondaryBackground, lineWidth: 1)
                .frame(width: radius * 2, height: radius * 2)
        }
    }

    private var dataPolygonFilled: some View {
        RadarPolygon(sides: 5, scale: 1.0, values: normalizedValues)
            .fill(Color.appPrimary.opacity(0.3))
            .frame(width: radius * 2, height: radius * 2)
            .scaleEffect(animationProgress)
    }

    private var dataPolygonStroked: some View {
        RadarPolygon(sides: 5, scale: 1.0, values: normalizedValues)
            .stroke(Color.appPrimary, lineWidth: 2)
            .frame(width: radius * 2, height: radius * 2)
            .scaleEffect(animationProgress)
    }

    private var dimensionLabels: some View {
        ForEach(0..<dimensions.count, id: \.self) { index in
            dimensionLabel(at: index)
        }
    }

    private func dimensionLabel(at index: Int) -> some View {
        let angle = (2 * .pi / Double(dimensions.count)) * Double(index) - .pi / 2
        let x = center.x + CGFloat(cos(angle)) * (radius + 30)
        let y = center.y + CGFloat(sin(angle)) * (radius + 30)

        return Text(dimensions[index].uppercased())
            .font(.caption2)
            .foregroundColor(.secondaryText)
            .position(x: x, y: y)
    }
}

struct RadarPolygon: Shape {
    let sides: Int
    let scale: Double
    var values: [Double]?

    func path(in rect: CGRect) -> Path {
        let center = CGPoint(x: rect.width / 2, y: rect.height / 2)
        let radius = min(rect.width, rect.height) / 2

        var path = Path()

        for i in 0..<sides {
            let angle = (2 * .pi / Double(sides)) * Double(i) - .pi / 2
            let value = values?[safe: i] ?? 1.0
            let distance = radius * scale * value
            let point = CGPoint(
                x: center.x + CGFloat(cos(angle)) * distance,
                y: center.y + CGFloat(sin(angle)) * distance
            )

            if i == 0 {
                path.move(to: point)
            } else {
                path.addLine(to: point)
            }
        }
        path.closeSubpath()

        return path
    }
}

// Safe array access extension
private extension Array {
    subscript(safe index: Int) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }
}

#Preview {
    VStack {
        RadarChartView(
            dimensions: ["DIRECTNESS", "BREVITY", "COMPLEXITY", "EXTENSIVITY", "HUMOR"],
            values: [8.5, 6.2, 7.8, 5.5, 4.2]
        )
        .frame(height: 250)
        .padding()
        .background(Color.appSecondaryBackground)
        .cornerRadius(CornerRadius.medium)
    }
    .padding()
    .background(Color.appBackground)
}
