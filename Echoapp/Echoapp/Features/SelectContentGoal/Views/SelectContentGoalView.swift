//
//  SelectContentGoalView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct SelectContentGoalView: View {
    @ObservedObject var viewModel: SelectContentGoalViewModel
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        ZStack {
            Color.adaptiveBackground(colorScheme)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                HStack {
                    Text("Onboarding")
                        .font(.caption)
                        .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                        .frame(maxWidth: .infinity, alignment: .leading)
                    
                    Text("Step 2 of 5")
                        .font(.caption)
                        .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                }
                .padding(.horizontal, Spacing.md)
                .padding(.top, Spacing.md)
                
                // Progress Bar
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.adaptiveSecondaryBackground(colorScheme))
                            .frame(height: 6)

                        Rectangle()
                            .fill(Color.appPrimary)
                            .frame(width: geometry.size.width * 0.4, height: 6)
                    }
                }
                .frame(height: 6)
                .padding(.horizontal, Spacing.md)
                .padding(.top, Spacing.sm)
                
                ScrollView {
                    VStack(spacing: Spacing.xl) {
                        // Title
                        VStack(spacing: Spacing.sm) {
                            Text("Select Your Content Goal")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                                .multilineTextAlignment(.center)
                            
                            Text("Our AI will tailor your voice and strategy to your specific professional objectives.")
                                .font(.body)
                                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, Spacing.lg)
                        }
                        .padding(.top, Spacing.xl)
                        
                        // Content Goal Cards
                        VStack(spacing: Spacing.md) {
                            ForEach(viewModel.goals, id: \.id) { goal in
                                ContentGoalCard(
                                    goal: goal,
                                    isSelected: viewModel.selectedGoal?.id == goal.id,
                                    isSuggested: goal.isSuggested
                                ) {
                                    viewModel.selectGoal(goal)
                                }
                            }
                        }
                        .padding(.horizontal, Spacing.md)
                        
                        // Continue Button
                        PrimaryButton("Continue") {
                            viewModel.continueFlow()
                        }
                        .padding(.horizontal, Spacing.lg)
                        .padding(.top, Spacing.lg)
                        .padding(.bottom, Spacing.xl)
                    }
                }
            }
        }
    }
}

struct ContentGoalCard: View {
    let goal: ContentGoal
    let isSelected: Bool
    let isSuggested: Bool
    let action: () -> Void
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        Button(action: action) {
            HStack(spacing: Spacing.md) {
                // Icon
                ZStack {
                    Circle()
                        .fill(Color.appPrimary.opacity(0.2))
                        .frame(width: 50, height: 50)
                    
                    Image(systemName: goal.icon)
                        .foregroundColor(.appPrimary)
                        .font(.title3)
                }
                
                // Content
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    HStack {
                        Text(goal.title)
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                        
                        if isSuggested {
                            BadgeView("SUGGESTED")
                                .padding(.leading, Spacing.xs)
                        }
                    }
                    
                    Text(goal.description)
                        .font(.body)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                        .fixedSize(horizontal: false, vertical: true)
                }
                
                Spacer()
                
                // Radio Button
                ZStack {
                    Circle()
                        .stroke(isSelected ? Color.appPrimary : Color.adaptiveTertiaryText(colorScheme), lineWidth: 2)
                        .frame(width: 24, height: 24)
                    
                    if isSelected {
                        Circle()
                            .fill(Color.appPrimary)
                            .frame(width: 16, height: 16)
                    }
                }
            }
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

#Preview {
    SelectContentGoalView(viewModel: SelectContentGoalViewModel())
}
