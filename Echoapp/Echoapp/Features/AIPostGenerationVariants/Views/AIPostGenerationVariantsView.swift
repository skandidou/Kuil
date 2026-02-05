//
//  AIPostGenerationVariantsView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct AIPostGenerationVariantsView: View {
    @ObservedObject var viewModel: AIPostGenerationVariantsViewModel
    @Environment(\.colorScheme) var colorScheme
    @State private var selectedVariant: VariantStyle = .shortPunchy
    @State private var showErrorAlert: Bool = false

    var body: some View {
        ZStack {
            Color.adaptiveBackground(colorScheme)
                .ignoresSafeArea()

            // Loading overlay
            if viewModel.isLoading {
                VStack(spacing: 16) {
                    ProgressView()
                        .scaleEffect(1.5)
                        .tint(.appPrimary)
                    Text("Generating AI drafts...")
                        .font(.subheadline)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.adaptiveBackground(colorScheme).opacity(0.9))
                .zIndex(10)
            }

            VStack(spacing: 0) {
                // Header
                HStack {
                    Button(action: {
                        viewModel.back()
                    }) {
                        Image(systemName: "arrow.left")
                            .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            .font(.headline)
                    }

                    VStack(spacing: 4) {
                        Text("AI Drafts")
                            .font(.headline)
                            .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                        Text("\(viewModel.variants.count) VARIANTS READY")
                            .font(.caption2)
                            .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                    }
                    .frame(maxWidth: .infinity)
                    
                    HStack(spacing: Spacing.md) {
                        Button(action: {
                            viewModel.share()
                        }) {
                            Image(systemName: "square.and.arrow.up")
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                                .font(.headline)
                        }

                        Button(action: {
                            viewModel.showMenu()
                        }) {
                            Image(systemName: "ellipsis")
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                                .font(.headline)
                        }
                    }
                }
                .padding(.horizontal, Spacing.md)
                .padding(.top, Spacing.md)
                
                // Style Selector
                HStack(spacing: 0) {
                    ForEach([VariantStyle.shortPunchy, .detailedStory, .educational], id: \.self) { style in
                        Button(action: {
                            selectedVariant = style
                        }) {
                            VStack(spacing: 4) {
                                Text(style.rawValue)
                                    .font(.headline)
                                    .foregroundColor(selectedVariant == style ? .appPrimary : .secondaryText)
                                    .padding(.vertical, Spacing.sm)
                                
                                if selectedVariant == style {
                                    Rectangle()
                                        .fill(Color.appPrimary)
                                        .frame(height: 2)
                                } else {
                                    Rectangle()
                                        .fill(Color.clear)
                                        .frame(height: 2)
                                }
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                }
                .padding(.horizontal, Spacing.md)
                .padding(.top, Spacing.sm)
                
                ScrollView {
                    VStack(spacing: Spacing.xl) {
                        if let variant = viewModel.getVariant(for: selectedVariant) {
                            VariantCard(variant: variant)
                                .padding(.horizontal, Spacing.md)
                                .padding(.top, Spacing.md)
                            
                            // Action Buttons
                            VStack(spacing: Spacing.md) {
                                PrimaryButton("Schedule Immediately", icon: "calendar") {
                                    viewModel.scheduleImmediately(variant)
                                }
                                .padding(.horizontal, Spacing.lg)
                                
                                SecondaryButton("Edit Draft") {
                                    viewModel.editDraft(variant)
                                }
                                .padding(.horizontal, Spacing.lg)
                                
                                HStack {
                                    Spacer()
                                    
                                    Button(action: {
                                        viewModel.regenerate(selectedVariant)
                                    }) {
                                        Image(systemName: "arrow.clockwise")
                                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                                            .font(.title3)
                                            .frame(width: 50, height: 50)
                                            .background(Color.adaptiveSecondaryBackground(colorScheme))
                                            .clipShape(Circle())
                                    }
                                }
                                .padding(.horizontal, Spacing.lg)
                            }
                            .padding(.top, Spacing.md)
                        }
                    }
                    .padding(.bottom, Spacing.xl)
                }
            }
        }
        .onChange(of: viewModel.errorMessage) { _, newValue in
            showErrorAlert = newValue != nil
        }
        .alert("Generation Failed", isPresented: $showErrorAlert) {
            Button("Retry") {
                viewModel.regenerate(selectedVariant)
            }
            Button("Cancel", role: .cancel) {
                viewModel.errorMessage = nil
            }
        } message: {
            Text(viewModel.errorMessage ?? "An error occurred while generating posts.")
        }
    }
}

struct VariantCard: View {
    let variant: UIPostVariant
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            HStack {
                HStack(spacing: Spacing.xs) {
                    Circle()
                        .fill(Color.successGreen)
                        .frame(width: 8, height: 8)
                    
                    Text(variant.rating)
                        .font(.caption)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                }
                
                Spacer()
                
                BadgeView("\(variant.score) SCORE", color: .appPrimary)
            }
            
            Text(variant.content)
                .font(.body)
                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                .lineSpacing(4)
            
            if !variant.hashtags.isEmpty {
                Text(variant.hashtags)
                    .font(.caption)
                    .foregroundColor(.appPrimary)
            }
            
            Divider()
                .background(Color.adaptiveSecondaryBackground(colorScheme))
            
            // Metrics
            HStack(spacing: 0) {
                VStack(spacing: 4) {
                    Text(variant.wordCount)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                    Text("WORDS")
                        .font(.caption2)
                        .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                }
                .frame(maxWidth: .infinity)

                Divider()
                    .frame(height: 30)
                    .background(Color.adaptiveSecondaryBackground(colorScheme))

                VStack(spacing: 4) {
                    Text(variant.readTime)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                    Text("READ TIME")
                        .font(.caption2)
                        .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                }
                .frame(maxWidth: .infinity)

                Divider()
                    .frame(height: 30)
                    .background(Color.adaptiveSecondaryBackground(colorScheme))

                VStack(spacing: 4) {
                    Text(variant.reach)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                    Text("LIKELY REACH")
                        .font(.caption2)
                        .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                }
                .frame(maxWidth: .infinity)
            }
            .padding(.top, Spacing.sm)
        }
        .padding(Spacing.lg)
        .background(Color.adaptiveSecondaryBackground(colorScheme))
        .cornerRadius(CornerRadius.medium)
    }
}

enum VariantStyle: String {
    case shortPunchy = "Short & Punchy"
    case detailedStory = "Detailed Story"
    case educational = "Educational"
}

struct UIPostVariant: Identifiable {
    let id = UUID()
    let style: VariantStyle
    let rating: String
    let score: Int
    let content: String
    let hashtags: String
    let wordCount: String
    let readTime: String
    let reach: String
}

#Preview {
    AIPostGenerationVariantsView(viewModel: AIPostGenerationVariantsViewModel())
}
