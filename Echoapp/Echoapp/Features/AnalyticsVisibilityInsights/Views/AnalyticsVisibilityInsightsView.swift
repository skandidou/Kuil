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
                    
                    // Re-auth banner if needed
                    if viewModel.needsReauth {
                        ReauthBanner(onReconnect: {
                            viewModel.handleReauth()
                        })
                        .padding(.horizontal, Spacing.md)
                    }

                    // Connect Analytics banner if not connected
                    if !viewModel.analyticsConnected && !viewModel.isLoading {
                        ConnectAnalyticsBanner(
                            isConnecting: viewModel.isConnectingAnalytics,
                            isExpired: viewModel.analyticsExpired,
                            onConnect: {
                                viewModel.connectAnalytics()
                            }
                        )
                        .padding(.horizontal, Spacing.md)
                    }

                    // Visibility Score Section
                    VStack(spacing: Spacing.md) {
                        HStack {
                            Text("VISIBILITY SCORE")
                                .font(.caption)
                                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))

                            Spacer()

                            // Sync button (only show if analytics connected)
                            if viewModel.analyticsConnected {
                                Button(action: {
                                    Task { await viewModel.syncAnalytics() }
                                }) {
                                    if viewModel.isSyncing {
                                        ProgressView()
                                            .scaleEffect(0.7)
                                    } else {
                                        Image(systemName: "arrow.clockwise")
                                            .foregroundColor(.appPrimary)
                                            .font(.caption)
                                    }
                                }
                                .disabled(viewModel.isSyncing)
                            }
                        }

                        HStack(spacing: Spacing.sm) {
                            Text(String(format: "%.0f", viewModel.visibilityScore))
                                .font(.system(size: 48, weight: .bold))
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                            if viewModel.scoreChange != 0 {
                                BadgeView(
                                    "\(viewModel.scoreChange >= 0 ? "+" : "")\(String(format: "%.0f", viewModel.scoreChange))",
                                    color: viewModel.scoreChange >= 0 ? .successGreen : .errorRed
                                )
                            }
                        }

                        Text(viewModel.analyticsConnected ? "Based on real LinkedIn engagement data" : "Connect LinkedIn Analytics to see real data")
                            .font(.caption)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))

                        // Key metrics grid
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: Spacing.md) {
                            MetricCard(
                                icon: "person.2.fill",
                                label: "Followers",
                                value: viewModel.formatNumber(viewModel.followerCount),
                                colorScheme: colorScheme
                            )

                            MetricCard(
                                icon: "link",
                                label: "Connections",
                                value: viewModel.formatNumber(viewModel.connectionCount),
                                colorScheme: colorScheme
                            )

                            MetricCard(
                                icon: "eye.fill",
                                label: "Impressions",
                                value: viewModel.formatNumber(viewModel.totalImpressions),
                                colorScheme: colorScheme
                            )

                            MetricCard(
                                icon: "hand.thumbsup.fill",
                                label: "Reactions",
                                value: viewModel.formatNumber(viewModel.totalReactions),
                                colorScheme: colorScheme
                            )
                        }
                        .padding(.top, Spacing.sm)

                        // Engagement rate
                        if viewModel.engagementRate > 0 {
                            HStack {
                                Text("Engagement Rate:")
                                    .font(.caption)
                                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                                Text(String(format: "%.2f%%", viewModel.engagementRate))
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.appPrimary)
                            }
                            .padding(.top, Spacing.xs)
                        }

                        // Last updated
                        if let lastUpdated = viewModel.lastUpdated {
                            Text("Updated: \(lastUpdated, style: .relative) ago")
                                .font(.caption2)
                                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                        }
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

                        // Heatmap component
                        BestTimesHeatmapView(
                            heatmap: viewModel.bestTimesHeatmap,
                            topSlots: viewModel.topPostingSlots,
                            dataSource: viewModel.bestTimesDataSource,
                            isLoading: viewModel.isLoadingBestTimes
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

struct MetricCard: View {
    let icon: String
    let label: String
    let value: String
    let colorScheme: ColorScheme

    var body: some View {
        VStack(spacing: Spacing.xs) {
            HStack(spacing: Spacing.xs) {
                Image(systemName: icon)
                    .foregroundColor(.appPrimary)
                    .font(.caption)
                Text(label)
                    .font(.caption)
                    .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
            }

            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
        }
        .frame(maxWidth: .infinity)
        .padding(Spacing.md)
        .background(Color.adaptiveBackground(colorScheme))
        .cornerRadius(CornerRadius.small)
    }
}

struct ReauthBanner: View {
    let onReconnect: () -> Void
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        HStack(spacing: Spacing.md) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.warningOrange)

            VStack(alignment: .leading, spacing: 2) {
                Text("Reconnect LinkedIn")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                Text("New analytics features require re-authorization")
                    .font(.caption)
                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
            }

            Spacer()

            Button(action: onReconnect) {
                Text("Reconnect")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .padding(.horizontal, Spacing.md)
                    .padding(.vertical, Spacing.xs)
                    .background(Color.appPrimary)
                    .cornerRadius(CornerRadius.small)
            }
        }
        .padding(Spacing.md)
        .background(Color.warningOrange.opacity(0.1))
        .cornerRadius(CornerRadius.medium)
    }
}

struct ConnectAnalyticsBanner: View {
    let isConnecting: Bool
    let isExpired: Bool
    let onConnect: () -> Void
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        VStack(spacing: Spacing.md) {
            HStack(spacing: Spacing.md) {
                Image(systemName: "chart.bar.xaxis")
                    .font(.system(size: 32))
                    .foregroundColor(.appPrimary)

                VStack(alignment: .leading, spacing: 4) {
                    Text(isExpired ? "Reconnect Analytics" : "Connect LinkedIn Analytics")
                        .font(.headline)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                    Text(isExpired
                         ? "Your analytics connection has expired"
                         : "Get real follower counts, impressions & engagement data")
                        .font(.caption)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                }

                Spacer()
            }

            Button(action: onConnect) {
                HStack {
                    if isConnecting {
                        ProgressView()
                            .scaleEffect(0.8)
                            .tint(.white)
                    } else {
                        Image(systemName: "link")
                        Text(isExpired ? "Reconnect" : "Connect Analytics")
                    }
                }
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.sm)
                .background(Color.appPrimary)
                .cornerRadius(CornerRadius.medium)
            }
            .disabled(isConnecting)
        }
        .padding(Spacing.lg)
        .background(Color.adaptiveSecondaryBackground(colorScheme))
        .cornerRadius(CornerRadius.medium)
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
    let impressions: String?
}

#Preview {
    AnalyticsVisibilityInsightsView(viewModel: AnalyticsVisibilityInsightsViewModel())
}
