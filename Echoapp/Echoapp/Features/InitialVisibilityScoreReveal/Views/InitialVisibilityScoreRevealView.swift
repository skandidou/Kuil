//
//  InitialVisibilityScoreRevealView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct InitialVisibilityScoreRevealView: View {
    @ObservedObject var viewModel: InitialVisibilityScoreRevealViewModel
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
                        
                        Spacer()
                    }
                    .padding(.horizontal, Spacing.md)
                    .padding(.top, Spacing.md)
                    
                    // Title Section
                    VStack(spacing: Spacing.sm) {
                        Text("VISIBILITY REPORT")
                            .font(.caption)
                            .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                        
                        Text("Analysis Complete")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                        
                        Text("Based on your recent activity and profile reach")
                            .font(.body)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, Spacing.lg)
                    }
                    .padding(.top, Spacing.lg)
                    
                    // Score Display
                    ZStack {
                        Circle()
                            .stroke(Color.adaptiveSecondaryBackground(colorScheme), lineWidth: 20)
                            .frame(width: 200, height: 200)
                        
                        Circle()
                            .trim(from: 0, to: viewModel.progress)
                            .stroke(Color.appPrimary, style: StrokeStyle(lineWidth: 20, lineCap: .round))
                            .frame(width: 200, height: 200)
                            .rotationEffect(.degrees(-90))
                        
                        VStack(spacing: 4) {
                            Text("\(viewModel.currentScore)")
                                .font(.system(size: 56, weight: .bold))
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            
                            Text("CURRENT SCORE")
                                .font(.caption)
                                .foregroundColor(.appPrimary)
                        }
                    }
                    .padding(.top, Spacing.xl)
                    
                    // Potential Growth Card
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        HStack {
                            Text("POTENTIAL GROWTH")
                                .font(.caption)
                                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))

                            Spacer()

                            Text("+\(viewModel.potentialGrowth)%")
                                .font(.headline)
                                .foregroundColor(.appPrimary)
                        }

                        HStack(spacing: Spacing.sm) {
                            Text("Target Score:")
                                .font(.headline)
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                            Text("\(viewModel.targetScore)")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(.warningYellow)
                        }
                        
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                Rectangle()
                                    .fill(Color.adaptiveSecondaryBackground(colorScheme))
                                    .frame(height: 8)
                                    .cornerRadius(4)

                                Rectangle()
                                    .fill(Color.warningYellow)
                                    .frame(width: geometry.size.width * CGFloat(viewModel.targetScore) / 100.0, height: 8)
                                    .cornerRadius(4)
                            }
                        }
                        .frame(height: 8)

                        Text(viewModel.insightText)
                            .font(.caption)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                    }
                    .padding(Spacing.lg)
                    .background(Color.adaptiveSecondaryBackground(colorScheme))
                    .cornerRadius(CornerRadius.medium)
                    .padding(.horizontal, Spacing.md)
                    
                    // Personalized Insight Card
                    HStack(spacing: Spacing.md) {
                        Image(systemName: "lightbulb.fill")
                            .foregroundColor(.accentLightBlue)
                            .font(.title3)
                        
                        VStack(alignment: .leading, spacing: Spacing.sm) {
                            Text("Personalized Insight")
                                .font(.headline)
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            
                            Text(viewModel.insightText)
                                .font(.body)
                                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                            
                            Button(action: {
                                viewModel.viewDetailedMetrics()
                            }) {
                                HStack(spacing: Spacing.xs) {
                                    Text("View Detailed Metrics")
                                        .font(.callout)
                                        .foregroundColor(.appPrimary)
                                    
                                    Image(systemName: "arrow.up")
                                        .foregroundColor(.appPrimary)
                                        .font(.caption)
                                }
                            }
                            .padding(.top, Spacing.xs)
                        }
                    }
                    .padding(Spacing.lg)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.adaptiveSecondaryBackground(colorScheme))
                    .cornerRadius(CornerRadius.medium)
                    .padding(.horizontal, Spacing.md)
                    
                    // Action Buttons
                    VStack(spacing: Spacing.md) {
                        PrimaryButton("Start Drafting First Post") {
                            viewModel.startDrafting()
                        }
                        .padding(.horizontal, Spacing.lg)
                        
                        SecondaryButton("How is this calculated?") {
                            viewModel.showCalculation()
                        }
                        .padding(.horizontal, Spacing.lg)
                    }
                    .padding(.top, Spacing.lg)
                    .padding(.bottom, Spacing.xl)
                }
            }
        }
        .onAppear {
            viewModel.animateScore()
        }
    }
}

#Preview {
    InitialVisibilityScoreRevealView(viewModel: InitialVisibilityScoreRevealViewModel())
}
