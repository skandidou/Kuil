//
//  ContentCalendarSchedulingView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct ContentCalendarSchedulingView: View {
    @ObservedObject var viewModel: ContentCalendarSchedulingViewModel
    @Environment(\.colorScheme) var colorScheme
    @State private var selectedDate = Date()

    var body: some View {
        ZStack {
            Color.adaptiveBackground(colorScheme)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                HStack {
                    if viewModel.isSelectionMode {
                        // Selection mode header
                        Button(action: { viewModel.exitSelectionMode() }) {
                            Text("Cancel")
                                .foregroundColor(.appPrimary)
                        }

                        Spacer()

                        Text("\(viewModel.selectedPostIds.count) selected")
                            .font(.headline)
                            .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                        Spacer()

                        Button(action: { viewModel.confirmBulkDelete() }) {
                            Text("Delete")
                                .foregroundColor(.errorRed)
                                .fontWeight(.semibold)
                        }
                        .disabled(viewModel.selectedPostIds.isEmpty)
                    } else {
                        // Normal header
                        HStack(spacing: Spacing.sm) {
                            Image(systemName: "calendar")
                                .foregroundColor(.appPrimary)
                                .font(.headline)

                            VStack(alignment: .leading, spacing: 2) {
                                Text("Content Calendar")
                                    .font(.headline)
                                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                                Text(selectedDate.formatted(date: .abbreviated, time: .omitted))
                                    .font(.caption)
                                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                            }
                        }

                        Spacer()

                        // Select button (only show if there are deletable posts)
                        if viewModel.hasDeletablePosts {
                            Button(action: { viewModel.enterSelectionMode() }) {
                                Text("Select")
                                    .font(.subheadline)
                                    .foregroundColor(.appPrimary)
                            }
                            .padding(.trailing, Spacing.sm)
                        }

                        Button(action: {
                            viewModel.createNew()
                        }) {
                            Image(systemName: "plus")
                                .foregroundColor(.white)
                                .font(.headline)
                                .frame(width: 36, height: 36)
                                .background(Color.appPrimary)
                                .clipShape(Circle())
                        }
                    }
                }
                .padding(.horizontal, Spacing.md)
                .padding(.top, Spacing.md)
                
                // Date Selector
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: Spacing.sm) {
                        ForEach(viewModel.days, id: \.id) { day in
                            DayButton(day: day, isSelected: viewModel.selectedDay?.id == day.id) {
                                viewModel.selectDay(day)
                            }
                        }
                    }
                    .padding(.horizontal, Spacing.md)
                }
                .padding(.top, Spacing.md)
                
                // Suggest Optimal Time Button
                SecondaryButton("Suggest Optimal Time") {
                    viewModel.suggestOptimalTime()
                }
                .padding(.horizontal, Spacing.md)
                .padding(.top, Spacing.md)
                
                // Timeline
                ScrollView {
                    TimelineView(viewModel: viewModel)
                        .padding(.horizontal, Spacing.md)
                        .padding(.top, Spacing.md)
                        .padding(.bottom, 100)
                }
                .refreshable {
                    viewModel.loadTimeline()
                }
            }

            // Loading overlay for optimal time
            if viewModel.isLoadingOptimalTime {
                Color.black.opacity(0.3)
                    .ignoresSafeArea()
                VStack {
                    ProgressView()
                        .scaleEffect(1.5)
                        .tint(.white)
                    Text("Analyzing best time...")
                        .font(.callout)
                        .foregroundColor(.white)
                        .padding(.top, Spacing.md)
                }
            }
        }
        .alert("Optimal Posting Time", isPresented: $viewModel.showOptimalTimeAlert) {
            Button("Got it") {
                viewModel.showOptimalTimeAlert = false
            }
        } message: {
            Text("Best time to post: \(viewModel.optimalTimeSuggestion)\n\n\(viewModel.optimalTimeReason)")
        }
        .alert("Delete Post", isPresented: $viewModel.showDeleteConfirmation) {
            Button("Cancel", role: .cancel) {
                viewModel.showDeleteConfirmation = false
            }
            Button("Delete", role: .destructive) {
                viewModel.deletePost()
            }
        } message: {
            Text("Are you sure you want to delete this post? This action cannot be undone.")
        }
        .sheet(isPresented: $viewModel.showEditSheet) {
            EditPostSheet(viewModel: viewModel)
        }
        .alert("Delete \(viewModel.selectedPostIds.count) Posts", isPresented: $viewModel.showBulkDeleteConfirmation) {
            Button("Cancel", role: .cancel) {
                viewModel.showBulkDeleteConfirmation = false
            }
            Button("Delete All", role: .destructive) {
                viewModel.performBulkDelete()
            }
        } message: {
            Text("Are you sure you want to delete \(viewModel.selectedPostIds.count) posts? This action cannot be undone.")
        }
    }
}

// MARK: - Edit Post Sheet
struct EditPostSheet: View {
    @ObservedObject var viewModel: ContentCalendarSchedulingViewModel
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            ZStack {
                Color.adaptiveBackground(colorScheme)
                    .ignoresSafeArea()

                VStack(spacing: Spacing.lg) {
                    // Content editor
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        Text("Post Content")
                            .font(.subheadline)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))

                        TextEditor(text: $viewModel.editingContent)
                            .frame(minHeight: 150)
                            .padding(Spacing.sm)
                            .background(Color.adaptiveSecondaryBackground(colorScheme))
                            .cornerRadius(CornerRadius.medium)
                    }

                    // Schedule time picker
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        Text("Scheduled Time")
                            .font(.subheadline)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))

                        DatePicker(
                            "Schedule",
                            selection: $viewModel.editingScheduledDate,
                            in: Date()...,
                            displayedComponents: [.date, .hourAndMinute]
                        )
                        .labelsHidden()
                        .datePickerStyle(.compact)
                    }

                    Spacer()

                    // Save button
                    PrimaryButton("Save Changes") {
                        viewModel.saveEditedPost()
                        dismiss()
                    }
                    .disabled(viewModel.editingContent.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                .padding(Spacing.lg)
            }
            .navigationTitle("Edit Post")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct DayButton: View {
    let day: DayModel
    let isSelected: Bool
    let action: () -> Void
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Text(day.dayName)
                    .font(.caption)
                    .foregroundColor(isSelected ? .white : Color.adaptiveSecondaryText(colorScheme))

                Text(day.dayNumber)
                    .font(.headline)
                    .foregroundColor(isSelected ? .white : Color.adaptivePrimaryText(colorScheme))
                
                if day.hasEvents {
                    Circle()
                        .fill(isSelected ? .white : .appPrimary)
                        .frame(width: 4, height: 4)
                } else {
                    Circle()
                        .fill(Color.clear)
                        .frame(width: 4, height: 4)
                }
            }
            .frame(width: 50)
            .padding(.vertical, Spacing.sm)
            .background(isSelected ? Color.appPrimary : Color.adaptiveSecondaryBackground(colorScheme))
            .cornerRadius(CornerRadius.medium)
        }
    }
}

struct TimelineView: View {
    @ObservedObject var viewModel: ContentCalendarSchedulingViewModel
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        ZStack(alignment: .leading) {
            // Timeline line
            Rectangle()
                .fill(Color.adaptiveSecondaryBackground(colorScheme))
                .frame(width: 2)
                .offset(x: viewModel.isSelectionMode ? 45 : 25)

            VStack(alignment: .leading, spacing: Spacing.xl) {
                ForEach(viewModel.timelineItems, id: \.id) { item in
                    TimelineItemView(
                        item: item,
                        isSelectionMode: viewModel.isSelectionMode,
                        isSelected: viewModel.selectedPostIds.contains(item.id),
                        onSelect: { viewModel.toggleSelection(item) },
                        onEdit: { post in viewModel.editPost(post) },
                        onDelete: { post in viewModel.confirmDeletePost(post) }
                    )
                }
            }
            .padding(.leading, Spacing.md)
        }
    }
}

struct TimelineItemView: View {
    let item: TimelineItemModel
    var isSelectionMode: Bool = false
    var isSelected: Bool = false
    var onSelect: (() -> Void)?
    let onEdit: ((TimelineItemModel) -> Void)?
    let onDelete: ((TimelineItemModel) -> Void)?
    @Environment(\.colorScheme) var colorScheme

    var isDeletable: Bool {
        item.status == "scheduled" || item.status == "failed"
    }

    var body: some View {
        HStack(alignment: .top, spacing: Spacing.md) {
            // Selection checkbox (only in selection mode for deletable items)
            if isSelectionMode && isDeletable {
                Button(action: { onSelect?() }) {
                    Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                        .foregroundColor(isSelected ? .appPrimary : Color.adaptiveSecondaryText(colorScheme))
                        .font(.title2)
                }
                .frame(width: 30)
            }

            // Time
            Text(item.time)
                .font(.caption)
                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                .frame(width: 60, alignment: .trailing)

            // Timeline dot
            ZStack {
                Circle()
                    .fill(Color.adaptiveBackground(colorScheme))
                    .frame(width: 12, height: 12)

                Circle()
                    .fill(item.statusColor)
                    .frame(width: 8, height: 8)
            }
            .offset(y: 4)

            // Content Card
            VStack(alignment: .leading, spacing: Spacing.sm) {
                if let badge = item.badge {
                    HStack {
                        BadgeView(badge, color: item.statusColor)
                        Spacer()
                    }
                }

                Text(item.title)
                    .font(.body)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                    .lineLimit(2)

                if let subtitle = item.subtitle {
                    HStack(spacing: Spacing.xs) {
                        Image(systemName: "person.circle.fill")
                            .foregroundColor(.appPrimary)
                            .font(.caption)

                        Text(subtitle)
                            .font(.caption)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                    }
                }

                if let engagement = item.engagement {
                    HStack(spacing: Spacing.md) {
                        HStack(spacing: 4) {
                            Image(systemName: "heart.fill")
                                .foregroundColor(.errorRed)
                                .font(.caption)
                            Text(engagement.likes)
                                .font(.caption)
                                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                        }

                        HStack(spacing: 4) {
                            Image(systemName: "bubble.left.fill")
                                .foregroundColor(.appPrimary)
                                .font(.caption)
                            Text(engagement.comments)
                                .font(.caption)
                                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                        }
                    }
                }

                // Action buttons for scheduled/failed posts (hide in selection mode)
                if !isSelectionMode && isDeletable {
                    HStack(spacing: Spacing.md) {
                        // Edit button (only for scheduled posts)
                        if item.status == "scheduled" {
                            Button(action: { onEdit?(item) }) {
                                HStack(spacing: 4) {
                                    Image(systemName: "pencil")
                                        .font(.caption)
                                    Text("Edit")
                                        .font(.caption)
                                }
                                .foregroundColor(.appPrimary)
                            }
                        }

                        // Delete button (for both scheduled and failed)
                        Button(action: { onDelete?(item) }) {
                            HStack(spacing: 4) {
                                Image(systemName: "trash")
                                    .font(.caption)
                                Text("Delete")
                                    .font(.caption)
                            }
                            .foregroundColor(.errorRed)
                        }
                    }
                    .padding(.top, Spacing.xs)
                }
            }
            .padding(Spacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(isSelected ? Color.appPrimary.opacity(0.1) : Color.adaptiveSecondaryBackground(colorScheme))
            .cornerRadius(CornerRadius.medium)
            .overlay(
                RoundedRectangle(cornerRadius: CornerRadius.medium)
                    .stroke(isSelected ? Color.appPrimary : (item.badge == nil ? Color.clear : item.statusColor), lineWidth: isSelected ? 2 : (item.badge == nil ? 0 : 2))
            )
        }
        .contentShape(Rectangle())
        .onTapGesture {
            if isSelectionMode && isDeletable {
                onSelect?()
            }
        }
    }
}

struct DayModel: Identifiable {
    let id = UUID()
    let dayName: String
    let dayNumber: String
    let date: Date
    let hasEvents: Bool
}

struct TimelineItemModel: Identifiable {
    let id: String  // Use post ID from backend
    let time: String
    let title: String
    let subtitle: String?
    let badge: String?
    let status: String  // Raw status for logic
    let statusColor: Color
    let engagement: (likes: String, comments: String)?
    let scheduledAt: String?  // ISO date for editing
}

#Preview {
    ContentCalendarSchedulingView(viewModel: ContentCalendarSchedulingViewModel())
}
