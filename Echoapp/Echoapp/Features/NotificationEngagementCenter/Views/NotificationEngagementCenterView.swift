//
//  NotificationEngagementCenterView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct NotificationEngagementCenterView: View {
    @ObservedObject var viewModel: NotificationEngagementCenterViewModel
    @State private var selectedFilter: NotificationFilter = .all
    
    var body: some View {
        ZStack {
            Color.appBackground
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                HStack {
                    Button(action: {
                        viewModel.back()
                    }) {
                        Image(systemName: "arrow.left")
                            .foregroundColor(.primaryText)
                            .font(.headline)
                    }
                    
                    Text("Activity Center")
                        .font(.headline)
                        .foregroundColor(.primaryText)
                        .frame(maxWidth: .infinity)
                    
                    Button(action: {
                        viewModel.showSettings()
                    }) {
                        Image(systemName: "gearshape")
                            .foregroundColor(.primaryText)
                            .font(.headline)
                    }
                }
                .padding(.horizontal, Spacing.md)
                .padding(.top, Spacing.md)
                
                // Filter Tabs
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: Spacing.sm) {
                        ForEach([NotificationFilter.all, .growth, .schedule, .ai], id: \.self) { filter in
                            FilterButton(filter: filter, isSelected: selectedFilter == filter) {
                                selectedFilter = filter
                            }
                        }
                    }
                    .padding(.horizontal, Spacing.md)
                }
                .padding(.top, Spacing.md)

                // Content
                ScrollView {
                    VStack(spacing: Spacing.xl) {
                        // Recent Section
                        if !viewModel.recentNotifications.isEmpty {
                            VStack(alignment: .leading, spacing: Spacing.md) {
                                Text("RECENT")
                                    .font(.caption)
                                    .foregroundColor(.tertiaryText)
                                    .padding(.horizontal, Spacing.md)

                                ForEach(viewModel.recentNotifications, id: \.id) { notification in
                                    NotificationCard(notification: notification)
                                        .padding(.horizontal, Spacing.md)
                                }
                            }
                            .padding(.top, Spacing.md)
                        }

                        // Scheduled Section
                        if !viewModel.scheduledNotifications.isEmpty {
                            VStack(alignment: .leading, spacing: Spacing.md) {
                                Text("SCHEDULED")
                                    .font(.caption)
                                    .foregroundColor(.tertiaryText)
                                    .padding(.horizontal, Spacing.md)

                                ForEach(viewModel.scheduledNotifications, id: \.id) { notification in
                                    NotificationCard(notification: notification)
                                        .padding(.horizontal, Spacing.md)
                                }
                            }
                        }

                        // Earlier This Week Section
                        if !viewModel.earlierNotifications.isEmpty {
                            VStack(alignment: .leading, spacing: Spacing.md) {
                                Text("EARLIER THIS WEEK")
                                    .font(.caption)
                                    .foregroundColor(.tertiaryText)
                                    .padding(.horizontal, Spacing.md)

                                ForEach(viewModel.earlierNotifications, id: \.id) { notification in
                                    NotificationCard(notification: notification)
                                        .padding(.horizontal, Spacing.md)
                                }
                            }
                        }

                        // Empty State
                        if viewModel.recentNotifications.isEmpty &&
                           viewModel.scheduledNotifications.isEmpty &&
                           viewModel.earlierNotifications.isEmpty &&
                           !viewModel.isLoading {
                            VStack(spacing: Spacing.md) {
                                Image(systemName: "bell.slash")
                                    .font(.system(size: 48))
                                    .foregroundColor(.tertiaryText)
                                    .padding(.top, 60)

                                Text("No Activity Yet")
                                    .font(.title3)
                                    .foregroundColor(.primaryText)

                                Text("Create and schedule posts to see your activity here")
                                    .font(.body)
                                    .foregroundColor(.secondaryText)
                                    .multilineTextAlignment(.center)
                                    .padding(.horizontal, 40)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.top, 80)
                        }
                    }
                    .padding(.bottom, 100)
                }
                .refreshable {
                    viewModel.loadNotifications()
                }
            }
        }
    }
}

enum NotificationFilter: String {
    case all = "All"
    case growth = "Growth"
    case schedule = "Schedule"
    case ai = "AI"
}

struct FilterButton: View {
    let filter: NotificationFilter
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(filter.rawValue)
                .font(.headline)
                .foregroundColor(isSelected ? .white : .secondaryText)
                .padding(.horizontal, Spacing.lg)
                .padding(.vertical, Spacing.sm)
                .background(isSelected ? Color.appPrimary : Color.appSecondaryBackground)
                .cornerRadius(CornerRadius.large)
        }
    }
}

struct NotificationCard: View {
    let notification: NotificationModel
    
    var body: some View {
        HStack(spacing: Spacing.md) {
            // Icon
            ZStack {
                RoundedRectangle(cornerRadius: CornerRadius.small)
                    .fill(notification.iconColor.opacity(0.2))
                    .frame(width: 50, height: 50)
                
                Image(systemName: notification.icon)
                    .foregroundColor(notification.iconColor)
                    .font(.title3)
            }
            
            // Content
            VStack(alignment: .leading, spacing: Spacing.xs) {
                HStack {
                    Text(notification.title)
                        .font(.headline)
                        .foregroundColor(.primaryText)
                    
                    if notification.isNew {
                        Circle()
                            .fill(Color.appPrimary)
                            .frame(width: 8, height: 8)
                    }
                }
                
                Text(notification.description)
                    .font(.body)
                    .foregroundColor(.secondaryText)
                    .lineLimit(2)
                
                if let timestamp = notification.timestamp {
                    Text(timestamp)
                        .font(.caption)
                        .foregroundColor(.tertiaryText)
                }
            }
            
            Spacer()
            
            // Action Button
            if let actionTitle = notification.actionTitle {
                Button(action: {
                    notification.action?()
                }) {
                    Text(actionTitle)
                        .font(.callout)
                        .foregroundColor(.white)
                        .padding(.horizontal, Spacing.md)
                        .padding(.vertical, Spacing.sm)
                        .background(notification.isHighlighted ? Color.appPrimary : Color.appSecondaryBackground)
                        .cornerRadius(CornerRadius.small)
                }
            }
        }
        .padding(Spacing.md)
        .background(notification.isHighlighted ? Color.appPrimary.opacity(0.1) : Color.appSecondaryBackground)
        .cornerRadius(CornerRadius.medium)
    }
}

struct NotificationModel: Identifiable {
    let id = UUID()
    let icon: String
    let iconColor: Color
    let title: String
    let description: String
    let timestamp: String?
    let actionTitle: String?
    let action: (() -> Void)?
    let isNew: Bool
    let isHighlighted: Bool
    
    init(icon: String, iconColor: Color, title: String, description: String, timestamp: String? = nil, actionTitle: String? = nil, action: (() -> Void)? = nil, isNew: Bool = false, isHighlighted: Bool = false) {
        self.icon = icon
        self.iconColor = iconColor
        self.title = title
        self.description = description
        self.timestamp = timestamp
        self.actionTitle = actionTitle
        self.action = action
        self.isNew = isNew
        self.isHighlighted = isHighlighted
    }
}

#Preview {
    NotificationEngagementCenterView(viewModel: NotificationEngagementCenterViewModel())
}
