//
//  CreateContentSourceSelectionView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct CreateContentSourceSelectionView: View {
    @ObservedObject var viewModel: CreateContentSourceSelectionViewModel
    @Environment(\.dismiss) var dismiss
    @State private var showEditor = false
    @State private var showDailySpark = false
    @State private var selectedSourceType: String = ""

    var body: some View {
        ZStack {
            Color.appBackground
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                HStack {
                    Button(action: {
                        dismiss()
                    }) {
                        Image(systemName: "xmark")
                            .foregroundColor(.primaryText)
                            .font(.headline)
                    }
                    
                    Text("Create Content")
                        .font(.headline)
                        .foregroundColor(.primaryText)
                        .frame(maxWidth: .infinity)
                    
                    Button(action: {
                        viewModel.showHelp()
                    }) {
                        Image(systemName: "questionmark.circle")
                            .foregroundColor(.primaryText)
                            .font(.headline)
                    }
                }
                .padding(.horizontal, Spacing.md)
                .padding(.top, Spacing.md)
                
                ScrollView {
                    VStack(spacing: Spacing.xl) {
                        // Prompt
                        VStack(spacing: Spacing.sm) {
                            Text("What's on your mind?")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(.primaryText)
                            
                            Text("Choose a source to start your next post")
                                .font(.body)
                                .foregroundColor(.secondaryText)
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
                        
                        // Other Methods
                        VStack(alignment: .leading, spacing: Spacing.md) {
                            Text("Other Methods")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.primaryText)
                                .padding(.horizontal, Spacing.md)
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: Spacing.md) {
                                    ForEach(viewModel.otherMethods, id: \.id) { method in
                                        OtherMethodCard(method: method) {
                                            viewModel.selectSource(method)
                                            selectedSourceType = method.title
                                            showEditor = true
                                        }
                                    }
                                }
                                .padding(.horizontal, Spacing.md)
                            }
                        }
                        .padding(.top, Spacing.md)
                        
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
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: Spacing.md) {
                // Icon
                ZStack {
                    Circle()
                        .fill(Color.appPrimary.opacity(0.2))
                        .frame(width: 60, height: 60)
                    
                    Image(systemName: source.icon)
                        .foregroundColor(.appPrimary)
                        .font(.title2)
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
                            .foregroundColor(.primaryText)
                            .multilineTextAlignment(.center)
                    }
                    
                    Text(source.description)
                        .font(.caption)
                        .foregroundColor(.secondaryText)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(Spacing.lg)
            .background(Color.appSecondaryBackground)
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
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: Spacing.md) {
                ZStack {
                    Circle()
                        .fill(Color.appPrimary.opacity(0.2))
                        .frame(width: 40, height: 40)
                    
                    Image(systemName: method.icon)
                        .foregroundColor(.appPrimary)
                        .font(.callout)
                }
                
                Text(method.title)
                    .font(.body)
                    .foregroundColor(.primaryText)
            }
            .padding(Spacing.md)
            .frame(width: 200)
            .background(Color.appSecondaryBackground)
            .cornerRadius(CornerRadius.medium)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    CreateContentSourceSelectionView(viewModel: CreateContentSourceSelectionViewModel())
}
