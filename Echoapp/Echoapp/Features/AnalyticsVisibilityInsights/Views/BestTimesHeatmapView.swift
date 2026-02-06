//
//  BestTimesHeatmapView.swift
//  Kuil
//
//  Created by Claude on 05/02/2026.
//

import SwiftUI

// MARK: - Response Models

struct BestTimesResponse: Codable {
    let heatmap: [[Double]]
    let topSlots: [PostingSlot]
    let dataSource: String
    let totalPostsAnalyzed: Int
}

struct PostingSlot: Codable, Identifiable {
    var id: String { "\(dayOfWeek)-\(hour)" }
    let dayOfWeek: Int
    let dayName: String?
    let hour: Int
    let hourFormatted: String?
    let score: Double

    // Support both old and new API response
    enum CodingKeys: String, CodingKey {
        case dayOfWeek
        case dayName
        case hour
        case hourFormatted
        case score
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        dayOfWeek = try container.decode(Int.self, forKey: .dayOfWeek)
        dayName = try container.decodeIfPresent(String.self, forKey: .dayName)
        hour = try container.decode(Int.self, forKey: .hour)
        hourFormatted = try container.decodeIfPresent(String.self, forKey: .hourFormatted)
        score = try container.decode(Double.self, forKey: .score)
    }

    // Convenience init for previews
    init(dayOfWeek: Int, hour: Int, score: Double) {
        self.dayOfWeek = dayOfWeek
        self.dayName = nil
        self.hour = hour
        self.hourFormatted = nil
        self.score = score
    }
}

// MARK: - Heatmap View

struct BestTimesHeatmapView: View {
    let heatmap: [[Double]]
    let topSlots: [PostingSlot]
    let dataSource: String
    let isLoading: Bool

    @Environment(\.colorScheme) var colorScheme

    private let days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
    private let displayHours = [6, 9, 12, 15, 18, 21] // Key hours to show

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            if isLoading {
                loadingView
            } else if heatmap.isEmpty {
                emptyStateView
            } else {
                contentView
            }
        }
        .padding(Spacing.md)
        .background(Color.adaptiveSecondaryBackground(colorScheme))
        .cornerRadius(CornerRadius.medium)
    }

    // MARK: - Loading View

    private var loadingView: some View {
        VStack(spacing: Spacing.md) {
            ProgressView()
            Text("Analyzing your posting patterns...")
                .font(.caption)
                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
        }
        .frame(maxWidth: .infinity)
        .frame(height: 200)
    }

    // MARK: - Empty State

    private var emptyStateView: some View {
        VStack(spacing: Spacing.sm) {
            Image(systemName: "clock.badge.questionmark")
                .font(.system(size: 40))
                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))

            Text("Not enough data")
                .font(.callout)
                .fontWeight(.medium)
                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))

            Text("Publish more posts to unlock personalized timing insights")
                .font(.caption)
                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 200)
    }

    // MARK: - Content View

    private var contentView: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            // Heatmap grid
            heatmapGrid

            // Legend
            legendView

            // Top posting times
            if !topSlots.isEmpty {
                topTimesSection
            }

            // Data source indicator
            dataSourceIndicator
        }
    }

    // MARK: - Heatmap Grid

    private var heatmapGrid: some View {
        VStack(spacing: 2) {
            // Hour labels row
            HStack(spacing: 2) {
                Text("")
                    .frame(width: 30)

                ForEach(displayHours, id: \.self) { hour in
                    Text("\(hour)h")
                        .font(.caption2)
                        .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                        .frame(maxWidth: .infinity)
                }
            }

            // Days rows
            ForEach(0..<7, id: \.self) { dayIndex in
                HStack(spacing: 2) {
                    // Day label
                    Text(days[dayIndex])
                        .font(.caption2)
                        .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                        .frame(width: 30, alignment: .leading)

                    // Hour cells
                    ForEach(displayHours, id: \.self) { hour in
                        let value = safeHeatmapValue(day: dayIndex, hour: hour)
                        HeatmapCell(value: value, maxValue: maxHeatmapValue)
                    }
                }
            }
        }
    }

    // MARK: - Legend

    private var legendView: some View {
        HStack(spacing: Spacing.sm) {
            Text("Less")
                .font(.caption2)
                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))

            HStack(spacing: 2) {
                ForEach([0.0, 0.25, 0.5, 0.75, 1.0], id: \.self) { level in
                    RoundedRectangle(cornerRadius: 2)
                        .fill(heatmapColor(for: level))
                        .frame(width: 16, height: 16)
                }
            }

            Text("More")
                .font(.caption2)
                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))

            Spacer()
        }
    }

    // MARK: - Top Times Section

    private var topTimesSection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Meilleurs créneaux")
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: Spacing.sm) {
                    ForEach(topSlots.prefix(5)) { slot in
                        TopSlotBadge(slot: slot, days: days)
                    }
                }
            }
        }
    }

    // MARK: - Data Source Indicator

    private var dataSourceIndicator: some View {
        HStack(spacing: Spacing.xs) {
            Image(systemName: dataSource == "user_data" ? "checkmark.circle.fill" : "info.circle")
                .font(.caption2)
                .foregroundColor(dataSource == "user_data" ? .successGreen : .appPrimary)

            Text(dataSource == "user_data"
                 ? "Based on your posting history"
                 : "Based on LinkedIn best practices")
                .font(.caption2)
                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
        }
    }

    // MARK: - Helpers

    private func safeHeatmapValue(day: Int, hour: Int) -> Double {
        guard day < heatmap.count, hour < heatmap[day].count else { return 0 }
        return heatmap[day][hour]
    }

    private var maxHeatmapValue: Double {
        heatmap.flatMap { $0 }.max() ?? 1.0
    }

    private func heatmapColor(for normalizedValue: Double) -> Color {
        if normalizedValue < 0.1 {
            return Color.adaptiveBackground(colorScheme)
        }
        return Color.appPrimary.opacity(0.2 + (normalizedValue * 0.8))
    }
}

// MARK: - Heatmap Cell

struct HeatmapCell: View {
    let value: Double
    let maxValue: Double

    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        let normalized = maxValue > 0 ? value / maxValue : 0

        RoundedRectangle(cornerRadius: 4)
            .fill(cellColor(normalized: normalized))
            .frame(maxWidth: .infinity)
            .frame(height: 24)
    }

    private func cellColor(normalized: Double) -> Color {
        if normalized < 0.1 {
            return Color.adaptiveBackground(colorScheme)
        }
        return Color.appPrimary.opacity(0.2 + (normalized * 0.8))
    }
}

// MARK: - Top Slot Badge

struct TopSlotBadge: View {
    let slot: PostingSlot
    let days: [String]

    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        VStack(spacing: 2) {
            Text(slot.dayName ?? days[slot.dayOfWeek])
                .font(.caption2)
                .fontWeight(.semibold)
                .foregroundColor(.appPrimary)

            Text(slot.hourFormatted ?? "\(slot.hour)h")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
        }
        .padding(.horizontal, Spacing.sm)
        .padding(.vertical, Spacing.xs)
        .background(Color.appPrimary.opacity(0.15))
        .cornerRadius(CornerRadius.small)
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: 20) {
        // With data
        BestTimesHeatmapView(
            heatmap: [
                [0, 0, 0, 0, 0, 0, 10, 20, 30, 50, 70, 80, 90, 60, 40, 30, 20, 30, 50, 40, 30, 20, 10, 0],
                [0, 0, 0, 0, 0, 0, 20, 40, 60, 80, 90, 85, 70, 50, 40, 30, 35, 40, 50, 40, 30, 20, 10, 0],
                [0, 0, 0, 0, 0, 0, 25, 45, 70, 100, 95, 80, 65, 55, 45, 35, 40, 45, 55, 45, 35, 25, 15, 0],
                [0, 0, 0, 0, 0, 0, 20, 40, 65, 90, 100, 90, 75, 60, 50, 40, 45, 50, 60, 50, 40, 30, 20, 0],
                [0, 0, 0, 0, 0, 0, 15, 35, 55, 75, 85, 80, 70, 55, 45, 35, 40, 45, 55, 45, 35, 25, 15, 0],
                [0, 0, 0, 0, 0, 0, 10, 25, 40, 55, 60, 55, 50, 40, 35, 30, 30, 35, 40, 35, 30, 20, 10, 0],
                [0, 0, 0, 0, 0, 0, 5, 15, 25, 35, 40, 45, 50, 45, 40, 35, 30, 25, 30, 25, 20, 15, 5, 0]
            ],
            topSlots: [
                PostingSlot(dayOfWeek: 2, hour: 10, score: 100),
                PostingSlot(dayOfWeek: 3, hour: 10, score: 90),
                PostingSlot(dayOfWeek: 1, hour: 9, score: 80)
            ],
            dataSource: "user_data",
            isLoading: false
        )

        // Loading state
        BestTimesHeatmapView(
            heatmap: [],
            topSlots: [],
            dataSource: "linkedin_defaults",
            isLoading: true
        )
    }
    .padding()
    .background(Color.gray.opacity(0.1))
}
