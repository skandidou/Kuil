//
//  MainDashboardView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct MainDashboardView: View {
    @ObservedObject var viewModel: MainDashboardViewModel
    @Environment(\.colorScheme) var colorScheme
    @State private var selectedTab: MainTab = .home
    @State private var showCreateContent = false
    @State private var showNotifications = false
    @State private var showAnalytics = false
    @State private var showProfile = false

    // Persist ViewModels with @StateObject to prevent recreation on body re-evaluation
    @StateObject private var calendarViewModel = ContentCalendarSchedulingViewModel()
    @StateObject private var createViewModel = CreateContentSourceSelectionViewModel()
    @StateObject private var analyticsViewModel = AnalyticsVisibilityInsightsViewModel()
    @StateObject private var profileViewModel = UserProfileVoiceSettingsViewModel()

    var body: some View {
        ZStack {
            Color.adaptiveBackground(colorScheme)
                .ignoresSafeArea()

            TabView(selection: $selectedTab) {
                DashboardHomeView(viewModel: viewModel)
                    .tabItem {
                        Label("Home", systemImage: "house.fill")
                    }
                    .tag(MainTab.home)

                ContentCalendarSchedulingView(viewModel: calendarViewModel)
                    .tabItem {
                        Label("Calendar", systemImage: "calendar")
                    }
                    .tag(MainTab.calendar)

                // Create tab shows the create content screen
                CreateContentSourceSelectionView(viewModel: createViewModel)
                    .tabItem {
                        Label("Create", systemImage: "plus.circle.fill")
                    }
                    .tag(MainTab.create)

                AnalyticsVisibilityInsightsView(viewModel: analyticsViewModel)
                    .tabItem {
                        Label("Analytics", systemImage: "chart.line.uptrend.xyaxis")
                    }
                    .tag(MainTab.analytics)

                UserProfileVoiceSettingsView(viewModel: profileViewModel)
                    .tabItem {
                        Label("Profile", systemImage: "person.fill")
                    }
                    .tag(MainTab.profile)
            }
            .accentColor(.appPrimary)
        }
    }
}

struct DashboardHomeView: View {
    @ObservedObject var viewModel: MainDashboardViewModel
    @Environment(\.colorScheme) var colorScheme
    @State private var showNotifications = false
    @State private var showCreateContent = false

    private var greetingText: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<12: return "Good morning"
        case 12..<18: return "Good afternoon"
        default: return "Good evening"
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.xl) {
                    // Header
                    HStack {
                        HStack(spacing: Spacing.md) {
                            Circle()
                                .fill(viewModel.roleColor.opacity(0.15))
                                .frame(width: 44, height: 44)
                                .overlay(
                                    Text(String(viewModel.userName.prefix(1)).uppercased())
                                        .font(.headline)
                                        .fontWeight(.bold)
                                        .foregroundColor(viewModel.roleColor)
                                )

                            VStack(alignment: .leading, spacing: Spacing.xxs) {
                                Text(viewModel.userRole.uppercased())
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(viewModel.roleColor)
                                    .lineLimit(1)

                                Text(greetingText + ", \(viewModel.userName)")
                                    .font(.headline)
                                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            }
                        }

                        Spacer()

                        HStack(spacing: Spacing.md) {
                            Button(action: {
                                showNotifications = true
                            }) {
                                ZStack(alignment: .topTrailing) {
                                    Image(systemName: "bell")
                                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                                        .font(.body)

                                    if viewModel.hasUnreadNotifications {
                                        Circle()
                                            .fill(Color.errorRed)
                                            .frame(width: 7, height: 7)
                                            .offset(x: 3, y: -3)
                                    }
                                }
                                .frame(width: 44, height: 44)
                            }
                        }
                    }
                    .padding(.horizontal, Spacing.lg)
                    .padding(.top, Spacing.md)
                    
                    // Network Visibility Score
                    VStack(spacing: Spacing.md) {
                        Text("NETWORK VISIBILITY SCORE")
                            .font(.caption)
                            .foregroundColor(Color.adaptiveTertiaryText(colorScheme))

                        ZStack {
                            Circle()
                                .stroke(Color.adaptiveSecondaryBackground(colorScheme), lineWidth: 20)
                                .frame(width: 180, height: 180)

                            if viewModel.visibilityScore > 0 {
                                Circle()
                                    .trim(from: 0, to: CGFloat(viewModel.visibilityScore) / 100.0)
                                    .stroke(Color.appPrimary, style: StrokeStyle(lineWidth: 20, lineCap: .round))
                                    .frame(width: 180, height: 180)
                                    .rotationEffect(.degrees(-90))
                            }

                            VStack(spacing: 4) {
                                if viewModel.visibilityScore > 0 {
                                    AnimatedNumberView(value: Double(viewModel.visibilityScore), fontSize: 56, fontWeight: .bold)

                                    if let scoreChange = viewModel.scoreChange {
                                        HStack(spacing: 4) {
                                            Image(systemName: scoreChange >= 0 ? "arrow.up" : "arrow.down")
                                                .font(.caption)
                                            Text(scoreChange >= 0 ? "+\(Int(scoreChange))%" : "\(Int(scoreChange))%")
                                                .font(.caption)
                                        }
                                        .foregroundColor(scoreChange >= 0 ? .accentTeal : .errorRed)
                                    }
                                } else {
                                    // Empty state
                                    VStack(spacing: Spacing.xs) {
                                        Image(systemName: "chart.bar.xaxis")
                                            .font(.system(size: 40))
                                            .foregroundColor(Color.adaptiveTertiaryText(colorScheme))

                                        Text("Connectez vos analytics")
                                            .font(.caption)
                                            .fontWeight(.semibold)
                                            .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                                        Text("pour voir votre score")
                                            .font(.caption2)
                                            .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                                    }
                                }
                            }
                        }

                        if viewModel.visibilityScore > 0 {
                            Text("Outperforming \(viewModel.visibilityScore)% of peers")
                                .font(.body)
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                        }

                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                // Background
                                Rectangle()
                                    .fill(Color.adaptiveSecondaryBackground(colorScheme))
                                    .frame(height: 6)
                                    .cornerRadius(3)

                                // Progress (dynamic based on visibility score)
                                let progressPercentage = CGFloat(viewModel.visibilityScore) / 100.0
                                Rectangle()
                                    .fill(Color.appPrimary)
                                    .frame(width: geometry.size.width * progressPercentage, height: 6)
                                    .cornerRadius(3)

                                // Position marker
                                Circle()
                                    .fill(Color.appPrimary)
                                    .frame(width: 12, height: 12)
                                    .offset(x: geometry.size.width * progressPercentage - 6)
                                    .shadow(color: Color.appPrimary.opacity(0.5), radius: 4)
                            }
                        }
                        .frame(height: 6)
                        .frame(maxWidth: 200)
                    }
                    .padding(.vertical, Spacing.lg)
                    
                    // Quick Stats Row
                    if let stats = viewModel.quickStats, stats.publishedPosts > 0 {
                        HStack(spacing: Spacing.md) {
                            QuickStatCard(
                                title: "Published",
                                value: "\(stats.publishedPosts)",
                                icon: "checkmark.circle.fill",
                                color: .successGreen,
                                colorScheme: colorScheme
                            )
                            QuickStatCard(
                                title: "Avg Hook",
                                value: "\(stats.averageHookScore)",
                                icon: "sparkles",
                                color: .appPrimary,
                                colorScheme: colorScheme
                            )
                            QuickStatCard(
                                title: "Total",
                                value: "\(stats.totalPosts)",
                                icon: "doc.text.fill",
                                color: .accentCyan,
                                colorScheme: colorScheme
                            )
                        }
                        .padding(.horizontal, Spacing.md)
                    }

                    // Best Time to Post
                    if let bestTime = viewModel.bestTime {
                        HStack(spacing: Spacing.md) {
                            Image(systemName: "clock.fill")
                                .foregroundColor(.appPrimary)
                                .font(.title3)

                            VStack(alignment: .leading, spacing: 2) {
                                Text("BEST TIME TO POST")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(Color.adaptiveTertiaryText(colorScheme))

                                Text("\(bestTime.dayName) at \(bestTime.hourFormatted)")
                                    .font(.headline)
                                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            }

                            Spacer()

                            Text("\(bestTime.score)%")
                                .font(.title3)
                                .fontWeight(.bold)
                                .foregroundColor(.appPrimary)
                        }
                        .padding(Spacing.md)
                        .background(Color.appPrimary.opacity(0.08))
                        .cornerRadius(CornerRadius.medium)
                        .padding(.horizontal, Spacing.md)
                    }

                    // Success Patterns
                    if !viewModel.successPatterns.isEmpty {
                        VStack(alignment: .leading, spacing: Spacing.md) {
                            Text("Your Winning Formula")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                                .padding(.horizontal, Spacing.md)

                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: Spacing.sm) {
                                    ForEach(viewModel.successPatterns) { pattern in
                                        VStack(spacing: Spacing.xs) {
                                            Text(patternIcon(pattern.type))
                                                .font(.title2)

                                            Text(formatPatternValue(pattern.value))
                                                .font(.caption)
                                                .fontWeight(.semibold)
                                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                                                .lineLimit(1)

                                            Text("\(pattern.successRate)% success")
                                                .font(.caption2)
                                                .foregroundColor(.successGreen)
                                        }
                                        .padding(Spacing.md)
                                        .frame(width: 100)
                                        .background(Color.adaptiveSecondaryBackground(colorScheme))
                                        .cornerRadius(CornerRadius.medium)
                                    }
                                }
                                .padding(.horizontal, Spacing.md)
                            }
                        }
                    }

                    // Daily Inspiration
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        HStack {
                            Text("Daily Inspiration")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                            Spacer()

                            Button(action: {
                                // Refine action
                            }) {
                                Text("REFINE AI")
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.accentCyan)
                                    .padding(.horizontal, Spacing.sm)
                                    .padding(.vertical, 4)
                                    .background(Color.accentCyan.opacity(0.15))
                                    .cornerRadius(4)
                            }
                        }
                        .padding(.horizontal, Spacing.md)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: Spacing.md) {
                                ForEach(viewModel.inspirationCards) { card in
                                    InspirationCard(card: card)
                                }
                            }
                            .padding(.horizontal, Spacing.md)
                        }
                    }
                    
                    // Coming Up Next
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Coming Up Next")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            .padding(.horizontal, Spacing.md)
                        
                        if let nextItem = viewModel.nextScheduledItem {
                            ScheduledItemCard(item: nextItem)
                                .padding(.horizontal, Spacing.md)
                        }
                    }
                }
                .padding(.bottom, 100)
            }
            .background(Color.adaptiveBackground(colorScheme))
            .sheet(isPresented: $showNotifications) {
                NotificationEngagementCenterView(viewModel: NotificationEngagementCenterViewModel())
            }
            .sheet(isPresented: $showCreateContent) {
                CreateContentSourceSelectionView(viewModel: CreateContentSourceSelectionViewModel())
            }
        }
    }
}

struct InspirationCard: View {
    let card: InspirationCardModel
    @Environment(\.colorScheme) var colorScheme
    @State private var isAppeared = false
    @State private var showCreateContent = false

    private var fallbackImageView: some View {
        RoundedRectangle(cornerRadius: CornerRadius.medium)
            .fill(
                LinearGradient(
                    colors: [Color.appPrimary.opacity(0.15), Color.appPrimary.opacity(0.05)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .frame(width: 280, height: 140)
            .overlay(
                Image(systemName: card.imageIcon)
                    .font(.system(size: 40))
                    .foregroundColor(.appPrimary.opacity(0.5))
            )
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            HStack {
                BadgeView(card.badge, color: card.badgeColor)
                Spacer()
            }

            // Image from URL or fallback
            if let imageUrl = card.imageUrl, let url = URL(string: imageUrl) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        RoundedRectangle(cornerRadius: CornerRadius.medium)
                            .fill(Color.appPrimary.opacity(0.1))
                            .frame(width: 280, height: 140)
                            .overlay(
                                ProgressView()
                                    .tint(.appPrimary)
                            )
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: 280, height: 140)
                            .clipped()
                            .cornerRadius(CornerRadius.medium)
                    case .failure:
                        fallbackImageView
                    @unknown default:
                        EmptyView()
                    }
                }
            } else {
                fallbackImageView
            }

            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(card.title)
                    .font(.headline)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                    .lineLimit(2)

                Text(card.subtitle)
                    .font(.caption)
                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
            }

            PrimaryButton("Develop Hook", icon: "bolt.fill") {
                // Navigate to create content with this inspiration topic
                showCreateContent = true
            }
        }
        .padding(Spacing.md)
        .frame(width: 280)
        .background(Color.adaptiveSecondaryBackground(colorScheme))
        .cornerRadius(CornerRadius.medium)
        .opacity(isAppeared ? 1 : 0)
        .offset(y: isAppeared ? 0 : 20)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.1)) {
                isAppeared = true
            }
        }
        .sheet(isPresented: $showCreateContent) {
            DailySparkView(inspirationTopic: card.title, inspirationSubtitle: card.subtitle)
        }
    }
}

struct ScheduledItemCard: View {
    let item: ScheduledItemModel
    @Environment(\.colorScheme) var colorScheme
    @State private var isAppeared = false

    var body: some View {
        HStack(spacing: Spacing.md) {
            ZStack {
                RoundedRectangle(cornerRadius: CornerRadius.small)
                    .fill(Color.appPrimary.opacity(0.2))
                    .frame(width: 50, height: 50)

                Image(systemName: "doc.badge.plus")
                    .foregroundColor(.appPrimary)
                    .font(.title3)
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: Spacing.xs) {
                    Image(systemName: "linkedin")
                        .foregroundColor(.appPrimary)
                        .font(.caption)

                    Text(item.platform)
                        .font(.caption)
                        .foregroundColor(.accentLightBlue)
                }

                Text(item.title)
                    .font(.body)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                    .lineLimit(1)

                Text(item.schedule)
                    .font(.caption)
                    .foregroundColor(.accentLightBlue)
            }
            
            Spacer()
            
            Button(action: {
                // Edit action
            }) {
                Image(systemName: "pencil")
                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                    .font(.callout)
            }
        }
        .padding(Spacing.md)
        .background(Color.adaptiveSecondaryBackground(colorScheme))
        .cornerRadius(CornerRadius.medium)
        .opacity(isAppeared ? 1 : 0)
        .offset(x: isAppeared ? 0 : -20)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.2)) {
                isAppeared = true
            }
        }
    }
}

struct QuickStatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    let colorScheme: ColorScheme

    var body: some View {
        VStack(spacing: Spacing.xs) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)

            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(Color.adaptivePrimaryText(colorScheme))

            Text(title)
                .font(.caption2)
                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Spacing.md)
        .background(Color.adaptiveSecondaryBackground(colorScheme))
        .cornerRadius(CornerRadius.medium)
    }
}

private func patternIcon(_ type: String) -> String {
    switch type {
    case "hook_style": return "🎣"
    case "length": return "📏"
    case "structure": return "📋"
    case "emoji_usage": return "😊"
    default: return "✨"
    }
}

private func formatPatternValue(_ value: String) -> String {
    switch value {
    case "question": return "Questions"
    case "personal": return "Personal"
    case "number": return "Numbers"
    case "short": return "Short"
    case "medium": return "Medium"
    case "long": return "Long"
    case "numbered_list": return "Lists"
    case "bullet_list": return "Bullets"
    case "none": return "No Emoji"
    case "minimal": return "Few Emoji"
    case "moderate": return "Some Emoji"
    default: return value.capitalized
    }
}

#Preview {
    MainDashboardView(viewModel: MainDashboardViewModel())
}
