//
//  AIProfileAnalysisLoadingView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct AIProfileAnalysisLoadingView: View {
    @ObservedObject var viewModel: AIProfileAnalysisLoadingViewModel
    
    var body: some View {
        ZStack {
            Color.appBackground
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                HStack {
                    Button(action: {
                        viewModel.cancel()
                    }) {
                        Image(systemName: "arrow.left")
                            .foregroundColor(.primaryText)
                            .font(.headline)
                    }
                    
                    Text("Onboarding")
                        .font(.headline)
                        .foregroundColor(.primaryText)
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
                                .stroke(Color.appSecondaryBackground, lineWidth: 12)
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
                                    .foregroundColor(.primaryText)
                            }
                        }
                        .padding(.top, Spacing.xxl)
                        
                        // Main Heading
                        Text("Analyzing your profile...")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.primaryText)
                        
                        // Description
                        Text("Our AI is crafting a custom model based on your unique expertise. This usually takes less than 30 seconds.")
                            .font(.body)
                            .foregroundColor(.secondaryText)
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
                        .background(Color.appSecondaryBackground)
                        .cornerRadius(CornerRadius.medium)
                        .padding(.horizontal, Spacing.md)
                        
                        // Deep Scan Status
                        VStack(spacing: Spacing.sm) {
                            Text("DEEP SCAN STATUS")
                                .font(.caption)
                                .foregroundColor(.tertiaryText)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            
                            GeometryReader { geometry in
                                ZStack(alignment: .leading) {
                                    Rectangle()
                                        .fill(Color.appSecondaryBackground)
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
                                .foregroundColor(.secondaryText)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(Spacing.md)
                        .background(Color.appSecondaryBackground)
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
                            .foregroundColor(.tertiaryText)
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
    
    var body: some View {
        HStack(spacing: Spacing.md) {
            if isCompleted {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.appPrimary)
                    .font(.headline)
            } else {
                if task.contains("Building") {
                    Circle()
                        .stroke(Color.tertiaryText, lineWidth: 2)
                        .frame(width: 24, height: 24)
                } else {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .appPrimary))
                        .frame(width: 24, height: 24)
                }
            }
            
            Text(task)
                .font(.body)
                .foregroundColor(isCompleted ? .primaryText : .secondaryText)
            
            Spacer()
        }
    }
}

#Preview {
    AIProfileAnalysisLoadingView(viewModel: AIProfileAnalysisLoadingViewModel())
}
