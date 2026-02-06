//
//  CreateContentSourceSelectionView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct CreateContentSourceSelectionView: View {
    @ObservedObject var viewModel: CreateContentSourceSelectionViewModel
    @Environment(\.colorScheme) var colorScheme
    @State private var showEditor = false
    @State private var showDailySpark = false
    @State private var selectedSourceType: String = ""

    var body: some View {
        ZStack {
            Color.adaptiveBackground(colorScheme)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                Text("Create Content")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                    .frame(maxWidth: .infinity)
                    .padding(.horizontal, Spacing.md)
                    .padding(.top, Spacing.md)

                ScrollView {
                    VStack(spacing: Spacing.xl) {
                        // Prompt
                        VStack(spacing: Spacing.sm) {
                            Text("What's on your mind?")
                                .font(.displayMedium)
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                            Text("Choose a source to start your next post")
                                .font(.body)
                                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                        }
                        .padding(.top, Spacing.xl)

                        // Source Cards Grid
                        LazyVGrid(columns: [
                            GridItem(.flexible(), spacing: Spacing.md),
                            GridItem(.flexible(), spacing: Spacing.md)
                        ], spacing: Spacing.md) {
                            ForEach(viewModel.sources, id: \.id) { source in
                                SourceCard(
                                    source: source,
                                    isSelected: viewModel.selectedSource?.id == source.id
                                ) {
                                    viewModel.selectSource(source)
                                    selectedSourceType = source.title

                                    // Open Daily Spark view if it's Daily Spark
                                    if source.title == "Daily Spark" {
                                        showDailySpark = true
                                    } else {
                                        showEditor = true
                                    }
                                }
                            }
                        }
                        .padding(.horizontal, Spacing.md)

                        Spacer(minLength: 100)
                    }
                }
            }
        }
        .sheet(isPresented: $showEditor) {
            SmartAIEditorView(
                viewModel: SmartAIEditorHookScorerViewModel(sourceType: selectedSourceType)
            )
        }
        .sheet(isPresented: $showDailySpark) {
            DailySparkView()
        }
    }
}

struct SourceCard: View {
    let source: ContentSource
    let isSelected: Bool
    let action: () -> Void
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        Button(action: action) {
            VStack(spacing: Spacing.md) {
                // Icon
                ZStack {
                    Circle()
                        .fill(Color.appPrimary.opacity(0.15))
                        .frame(width: 56, height: 56)

                    Image(systemName: source.icon)
                        .foregroundColor(.appPrimary)
                        .font(.title3)
                }

                // Content
                VStack(spacing: Spacing.xs) {
                    HStack {
                        if source.isAIPick {
                            BadgeView("AI PICK")
                                .padding(.trailing, Spacing.xs)
                        }

                        Text(source.title)
                            .font(.headline)
                            .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            .multilineTextAlignment(.center)
                    }

                    Text(source.description)
                        .font(.caption)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(Spacing.lg)
            .background(Color.adaptiveSecondaryBackground(colorScheme))
            .cornerRadius(CornerRadius.medium)
            .overlay(
                RoundedRectangle(cornerRadius: CornerRadius.medium)
                    .stroke(isSelected ? Color.appPrimary : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct OtherMethodCard: View {
    let method: ContentSource
    let action: () -> Void
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        Button(action: action) {
            HStack(spacing: Spacing.md) {
                ZStack {
                    Circle()
                        .fill(Color.appPrimary.opacity(0.15))
                        .frame(width: 40, height: 40)

                    Image(systemName: method.icon)
                        .foregroundColor(.appPrimary)
                        .font(.callout)
                }

                Text(method.title)
                    .font(.body)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
            }
            .padding(Spacing.md)
            .frame(width: 200)
            .background(Color.adaptiveSecondaryBackground(colorScheme))
            .cornerRadius(CornerRadius.medium)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    CreateContentSourceSelectionView(viewModel: CreateContentSourceSelectionViewModel())
}
