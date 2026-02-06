//
//  AIProfileAnalysisLoadingView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct AIProfileAnalysisLoadingView: View {
    @ObservedObject var viewModel: AIProfileAnalysisLoadingViewModel
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        ZStack {
            Color.adaptiveBackground(colorScheme)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                HStack {
                    Button(action: {
                        viewModel.cancel()
                    }) {
                        Image(systemName: "arrow.left")
                            .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            .font(.headline)
                    }
                    
                    Text("Onboarding")
                        .font(.headline)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                        .frame(maxWidth: .infinity)
                    
                    Spacer()
                }
                .padding(.horizontal, Spacing.md)
                .padding(.top, Spacing.md)
                
                ScrollView {
                    VStack(spacing: Spacing.xl) {
                        // Progress Circle
                        ZStack {
                            Circle()
                                .stroke(Color.adaptiveSecondaryBackground(colorScheme), lineWidth: 12)
                                .frame(width: 160, height: 160)
                            
                            Circle()
                                .trim(from: 0, to: viewModel.progress)
                                .stroke(Color.appPrimary, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                                .frame(width: 160, height: 160)
                                .rotationEffect(.degrees(-90))
                            
                            VStack(spacing: 4) {
                                Image(systemName: "brain.head.profile")
                                    .font(.system(size: 40))
                                    .foregroundColor(.appPrimary)
                                
                                Text("\(Int(viewModel.progress * 100))%")
                                    .font(.title)
                                    .fontWeight(.bold)
                                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            }
                        }
                        .padding(.top, Spacing.xxl)
                        
                        // Main Heading
                        Text("Analyzing your profile...")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                        
                        // Description
                        Text("Our AI is crafting a custom model based on your unique expertise. This usually takes less than 30 seconds.")
                            .font(.body)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, Spacing.lg)
                        
                        // Task List
                        VStack(spacing: Spacing.md) {
                            TaskRow(task: "Fetching last 20 posts...", isCompleted: true)
                            TaskRow(task: "Analyzing writing hooks...", isCompleted: true)
                            TaskRow(task: "Identifying top keywords...", isCompleted: viewModel.progress > 0.5)
                            TaskRow(task: "Building VoiceSignature...", isCompleted: viewModel.progress > 0.9)
                        }
                        .padding(Spacing.md)
                        .background(Color.adaptiveSecondaryBackground(colorScheme))
                        .cornerRadius(CornerRadius.medium)
                        .padding(.horizontal, Spacing.md)

                        // Deep Scan Status
                        VStack(spacing: Spacing.sm) {
                            Text("DEEP SCAN STATUS")
                                .font(.caption)
                                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                                .frame(maxWidth: .infinity, alignment: .leading)
                            
                            GeometryReader { geometry in
                                ZStack(alignment: .leading) {
                                    Rectangle()
                                        .fill(Color.adaptiveSecondaryBackground(colorScheme))
                                        .frame(height: 8)
                                        .cornerRadius(4)
                                    
                                    Rectangle()
                                        .fill(Color.appPrimary)
                                        .frame(width: geometry.size.width * viewModel.progress, height: 8)
                                        .cornerRadius(4)
                                }
                            }
                            .frame(height: 8)
                            
                            Text("Processing vectors...")
                                .font(.caption)
                                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(Spacing.md)
                        .background(Color.adaptiveSecondaryBackground(colorScheme))
                        .cornerRadius(CornerRadius.medium)
                        .padding(.horizontal, Spacing.md)

                        // Cancel Button
                        SecondaryButton("Cancel Analysis") {
                            viewModel.cancel()
                        }
                        .padding(.horizontal, Spacing.lg)
                        .padding(.top, Spacing.md)
                        
                        // Security Footer
                        Text("SECURE DATA ENCRYPTION ACTIVE")
                            .font(.caption2)
                            .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                            .padding(.top, Spacing.lg)
                    }
                    .padding(.vertical, Spacing.lg)
                }
            }
        }
        .onAppear {
            viewModel.startAnalysis()
        }
    }
}

struct TaskRow: View {
    let task: String
    let isCompleted: Bool
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        HStack(spacing: Spacing.md) {
            if isCompleted {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.appPrimary)
                    .font(.headline)
            } else {
                if task.contains("Building") {
                    Circle()
                        .stroke(Color.adaptiveTertiaryText(colorScheme), lineWidth: 2)
                        .frame(width: 24, height: 24)
                } else {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .appPrimary))
                        .frame(width: 24, height: 24)
                }
            }
            
            Text(task)
                .font(.body)
                .foregroundColor(isCompleted ? Color.adaptivePrimaryText(colorScheme) : Color.adaptiveSecondaryText(colorScheme))
            
            Spacer()
        }
    }
}

#Preview {
    AIProfileAnalysisLoadingView(viewModel: AIProfileAnalysisLoadingViewModel())
}
