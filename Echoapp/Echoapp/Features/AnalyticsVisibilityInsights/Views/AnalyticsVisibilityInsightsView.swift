//
//  AnalyticsVisibilityInsightsView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct AnalyticsVisibilityInsightsView: View {
    @ObservedObject var viewModel: AnalyticsVisibilityInsightsViewModel
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        ZStack {
            Color.adaptiveBackground(colorScheme)
                .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: Spacing.xl) {
                    // Header
                    HStack {
                        Button(action: {
                            viewModel.back()
                        }) {
                            Image(systemName: "arrow.left")
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                                .font(.headline)
                        }

                        Text("Visibility Insights")
                            .font(.headline)
                            .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            .frame(maxWidth: .infinity)
                        
                        Button(action: {
                            viewModel.showCalendar()
                        }) {
                            Image(systemName: "calendar")
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                                .font(.headline)
                        }
                    }
                    .padding(.horizontal, Spacing.md)
                    .padding(.top, Spacing.md)
                    
                    // Visibility Score Section
                    VStack(spacing: Spacing.md) {
                        Text("VISIBILITY SCORE")
                            .font(.caption)
                            .foregroundColor(Color.adaptiveTertiaryText(colorScheme))

                        HStack(spacing: Spacing.sm) {
                            Text(String(format: "%.1f", viewModel.visibilityScore))
                                .font(.system(size: 48, weight: .bold))
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            
                            BadgeView("+\(String(format: "%.1f", viewModel.scoreChange))%", color: .successGreen)
                        }
                        
                        Text("Based on weighted engagement vs. peers")
                            .font(.caption)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))

                        // Chart placeholder
                        RoundedRectangle(cornerRadius: CornerRadius.medium)
                            .fill(Color.adaptiveSecondaryBackground(colorScheme))
                            .frame(height: 200)
                            .overlay(
                                VStack {
                                    Text("Visibility Trend Chart")
                                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                                    Text("May 01 → May 15 → Today")
                                        .font(.caption)
                                        .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                                }
                            )
                            .padding(.top, Spacing.sm)
                    }
                    .padding(Spacing.lg)
                    .background(Color.adaptiveSecondaryBackground(colorScheme))
                    .cornerRadius(CornerRadius.medium)
                    .padding(.horizontal, Spacing.md)
                    .padding(.top, Spacing.md)
                    
                    // Best Times to Post
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        HStack {
                            Text("Best Times to Post")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            
                            Spacer()
                            
                            Text("Engagement Peak")
                                .font(.caption)
                                .foregroundColor(.appPrimary)
                        }
                        .padding(.horizontal, Spacing.md)
                        
                        // Grid placeholder
                        RoundedRectangle(cornerRadius: CornerRadius.medium)
                            .fill(Color.adaptiveSecondaryBackground(colorScheme))
                            .frame(height: 200)
                            .overlay(
                                Text("Best Times Grid")
                                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                            )
                            .padding(.horizontal, Spacing.md)
                    }
                    
                    // AI Growth Insights
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        HStack(spacing: Spacing.sm) {
                            Image(systemName: "sparkles")
                                .foregroundColor(.appPrimary)
                            Text("AI Growth Insights")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                            Spacer()

                            if viewModel.isLoadingInsights {
                                ProgressView()
                                    .scaleEffect(0.8)
                            }
                        }
                        .padding(.horizontal, Spacing.md)

                        if viewModel.insights.isEmpty && !viewModel.isLoadingInsights {
                            // Empty state
                            VStack(spacing: Spacing.sm) {
                                Image(systemName: "lightbulb")
                                    .font(.system(size: 40))
                                    .foregroundColor(Color.adaptiveTertiaryText(colorScheme))

                                Text("No insights yet")
                                    .font(.callout)
                                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))

                                Text("Publish more posts to unlock AI-powered insights")
                                    .font(.caption)
                                    .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                                    .multilineTextAlignment(.center)
                            }
                            .padding(.vertical, Spacing.xl)
                            .frame(maxWidth: .infinity)
                            .background(Color.adaptiveSecondaryBackground(colorScheme))
                            .cornerRadius(CornerRadius.medium)
                            .padding(.horizontal, Spacing.md)
                        } else {
                            VStack(spacing: Spacing.md) {
                                ForEach(viewModel.insights) { insight in
                                    InsightCard(
                                        icon: insight.icon,
                                        text: insight.text
                                    )
                                }
                            }
                            .padding(.horizontal, Spacing.md)
                        }
                    }
                    
                    // Top Performing Posts
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Top Performing Posts")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            .padding(.horizontal, Spacing.md)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: Spacing.md) {
                                ForEach(viewModel.topPosts, id: \.id) { post in
                                    TopPostCard(post: post)
                                }
                            }
                            .padding(.horizontal, Spacing.md)
                        }
                    }
                    .padding(.bottom, Spacing.xl)
                }
            }
        }
    }
}

struct PerformanceCard: View {
    let icon: String
    let change: String
    let label: String
    let value: String
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        VStack(spacing: Spacing.sm) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(.appPrimary)
                    .font(.callout)

                Spacer()

                Text(change)
                    .font(.caption)
                    .foregroundColor(.successGreen)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(label)
                    .font(.caption2)
                    .foregroundColor(Color.adaptiveTertiaryText(colorScheme))

                Text(value)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(Spacing.md)
        .frame(maxWidth: .infinity)
        .background(Color.adaptiveSecondaryBackground(colorScheme))
        .cornerRadius(CornerRadius.medium)
    }
}

struct InsightCard: View {
    let icon: String
    let text: String
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        HStack(alignment: .top, spacing: Spacing.md) {
            Image(systemName: icon)
                .foregroundColor(.appPrimary)
                .font(.callout)

            Text(text)
                .font(.body)
                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.adaptiveSecondaryBackground(colorScheme))
        .cornerRadius(CornerRadius.medium)
    }
}

struct TopPostCard: View {
    let post: TopPostModel
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            RoundedRectangle(cornerRadius: CornerRadius.medium)
                .fill(Color.appPrimary.opacity(0.2))
                .frame(width: 200, height: 120)
                .overlay(
                    Image(systemName: "doc.text.fill")
                        .font(.system(size: 40))
                        .foregroundColor(.appPrimary.opacity(0.5))
                )

            Text(post.title)
                .font(.body)
                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                .lineLimit(2)
            
            HStack(spacing: Spacing.md) {
                HStack(spacing: 4) {
                    Image(systemName: "hand.thumbsup.fill")
                        .foregroundColor(.errorRed)
                        .font(.caption)
                    Text(post.likes)
                        .font(.caption)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                }
                
                HStack(spacing: 4) {
                    Image(systemName: "bubble.left.fill")
                        .foregroundColor(.appPrimary)
                        .font(.caption)
                    Text(post.comments)
                        .font(.caption)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                }
            }
        }
        .frame(width: 200)
        .padding(Spacing.md)
        .background(Color.adaptiveSecondaryBackground(colorScheme))
        .cornerRadius(CornerRadius.medium)
    }
}

struct TopPostModel: Identifiable {
    let id = UUID()
    let title: String
    let likes: String
    let comments: String
}

#Preview {
    AnalyticsVisibilityInsightsView(viewModel: AnalyticsVisibilityInsightsViewModel())
}
