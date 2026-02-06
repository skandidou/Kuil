//
//  FounderViralPostDatabaseView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct FounderViralPostDatabaseView: View {
    @Environment(\.colorScheme) var colorScheme
    @ObservedObject var viewModel: FounderViralPostDatabaseViewModel
    @State private var searchText: String = ""
    @State private var selectedCategory: String = "All"
    
    var body: some View {
        ZStack {
            Color.adaptiveBackground(colorScheme)
                .ignoresSafeArea()
            
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
                        Text("Viral Database")
                            .font(.headline)
                            .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                        
                        BadgeView("FOUNDER TIER", color: .appPrimary)
                    }
                    .frame(maxWidth: .infinity)
                    
                    Button(action: {
                        viewModel.showFavorites()
                    }) {
                        Image(systemName: "star.fill")
                            .foregroundColor(.warningYellow)
                            .font(.headline)
                    }
                }
                .padding(.horizontal, Spacing.md)
                .padding(.top, Spacing.md)
                
                // Search Bar
                HStack(spacing: Spacing.md) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                        .font(.callout)
                    
                    TextField("Search industries or keywords...", text: $searchText)
                        .font(.body)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                }
                .padding(Spacing.md)
                .background(Color.adaptiveSecondaryBackground(colorScheme))
                .cornerRadius(CornerRadius.medium)
                .padding(.horizontal, Spacing.md)
                .padding(.top, Spacing.md)
                
                // Category Filters
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: Spacing.sm) {
                        ForEach(viewModel.categories, id: \.self) { category in
                            Button(action: {
                                selectedCategory = category
                            }) {
                                Text(category)
                                    .font(.headline)
                                    .foregroundColor(selectedCategory == category ? .white : Color.adaptiveSecondaryText(colorScheme))
                                    .padding(.horizontal, Spacing.lg)
                                    .padding(.vertical, Spacing.sm)
                                    .background(selectedCategory == category ? Color.appPrimary : Color.adaptiveSecondaryBackground(colorScheme))
                                    .cornerRadius(CornerRadius.large)
                            }
                        }
                    }
                    .padding(.horizontal, Spacing.md)
                }
                .padding(.top, Spacing.md)
                
                // Section Header
                HStack {
                    Text("Trending Hook Patterns")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                    
                    Spacer()
                    
                    Button(action: {
                        viewModel.viewAll()
                    }) {
                        Text("View All")
                            .font(.callout)
                            .foregroundColor(.appPrimary)
                    }
                }
                .padding(.horizontal, Spacing.md)
                .padding(.top, Spacing.lg)
                
                // Content List
                ScrollView {
                    VStack(spacing: Spacing.md) {
                        ForEach(viewModel.hookPatterns, id: \.id) { pattern in
                            HookPatternCard(pattern: pattern)
                                .padding(.horizontal, Spacing.md)
                        }
                    }
                    .padding(.top, Spacing.md)
                    .padding(.bottom, 100)
                }
            }
        }
    }
}

struct HookPatternCard: View {
    @Environment(\.colorScheme) var colorScheme
    let pattern: HookPatternModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            // Header
            HStack(spacing: Spacing.sm) {
                Circle()
                    .fill(pattern.authorColor.opacity(0.2))
                    .frame(width: 40, height: 40)
                    .overlay(
                        Text(pattern.authorInitials)
                            .font(.headline)
                            .foregroundColor(pattern.authorColor)
                    )
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(pattern.authorName)
                        .font(.headline)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                    
                    Text(pattern.metrics)
                        .font(.caption)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                }
                
                Spacer()
                
                Button(action: {
                    pattern.bookmarkAction?()
                }) {
                    Image(systemName: pattern.isBookmarked ? "bookmark.fill" : "bookmark")
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                        .font(.callout)
                }
            }
            
            // Quote
            Text("\"\(pattern.quote)\"")
                .font(.body)
                .italic()
                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                .lineSpacing(4)
            
            // AI Analysis
            VStack(alignment: .leading, spacing: Spacing.sm) {
                HStack(spacing: Spacing.xs) {
                    Image(systemName: "bolt.fill")
                        .foregroundColor(.appPrimary)
                        .font(.caption)
                    
                    Text("AI HOOK ANALYSIS")
                        .font(.caption)
                        .foregroundColor(.appPrimary)
                }
                
                Text(pattern.analysis)
                    .font(.body)
                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
            }
            
            // Action Button
            PrimaryButton("Rewrite in my Voice", icon: "pencil") {
                pattern.rewriteAction?()
            }
        }
        .padding(Spacing.lg)
        .background(Color.adaptiveSecondaryBackground(colorScheme))
        .cornerRadius(CornerRadius.medium)
    }
}

struct HookPatternModel: Identifiable {
    let id = UUID()
    let authorName: String
    let authorInitials: String
    let authorColor: Color
    let metrics: String
    let quote: String
    let analysis: String
    let isBookmarked: Bool
    let bookmarkAction: (() -> Void)?
    let rewriteAction: (() -> Void)?
}

#Preview {
    FounderViralPostDatabaseView(viewModel: FounderViralPostDatabaseViewModel())
}
