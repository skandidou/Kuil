//
//  CVToPostConverterFlowView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct CVToPostConverterFlowView: View {
    @ObservedObject var viewModel: CVToPostConverterFlowViewModel
    @State private var selectedTone: NarrativeTone = .humble
    @State private var selectedAchievements: Set<UUID> = []
    
    var body: some View {
        ZStack {
            Color.appBackground
                .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: Spacing.xl) {
                    // Header
                    HStack {
                        Button(action: {
                            viewModel.back()
                        }) {
                            Image(systemName: "arrow.left")
                                .foregroundColor(.primaryText)
                                .font(.headline)
                        }
                        
                        Text("CV-to-Post")
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
                    
                    // Title Section
                    VStack(spacing: Spacing.sm) {
                        Text("Generate LinkedIn Posts")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.primaryText)
                        
                        Text("Convert your professional milestones into viral narratives.")
                            .font(.body)
                            .foregroundColor(.secondaryText)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, Spacing.lg)
                    }
                    .padding(.top, Spacing.lg)
                    
                    // Upload CV Section
                    VStack(spacing: Spacing.md) {
                        ZStack {
                            RoundedRectangle(cornerRadius: CornerRadius.medium)
                                .strokeBorder(style: StrokeStyle(lineWidth: 2, dash: [10]))
                                .fill(Color.tertiaryText.opacity(0.3))
                                .frame(height: 200)
                            
                            VStack(spacing: Spacing.md) {
                                Image(systemName: "arrow.up.circle.fill")
                                    .font(.system(size: 50))
                                    .foregroundColor(.appPrimary)
                                
                                Text("Upload CV/Resume")
                                    .font(.headline)
                                    .foregroundColor(.primaryText)
                                
                                Text("Drag and drop PDF or Browse files")
                                    .font(.caption)
                                    .foregroundColor(.secondaryText)
                            }
                        }
                        .padding(.horizontal, Spacing.md)
                        
                        PrimaryButton("Browse Files", icon: "folder.fill") {
                            viewModel.browseFiles()
                        }
                        .padding(.horizontal, Spacing.md)
                    }
                    
                    // Select Achievements Section
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Select Achievements")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.primaryText)
                            .padding(.horizontal, Spacing.md)
                        
                        Text("Select the points you want the AI to focus on.")
                            .font(.body)
                            .foregroundColor(.secondaryText)
                            .padding(.horizontal, Spacing.md)
                        
                        VStack(spacing: Spacing.sm) {
                            ForEach(viewModel.achievements, id: \.id) { achievement in
                                AchievementRow(
                                    achievement: achievement,
                                    isSelected: selectedAchievements.contains(achievement.id)
                                ) {
                                    if selectedAchievements.contains(achievement.id) {
                                        selectedAchievements.remove(achievement.id)
                                    } else {
                                        selectedAchievements.insert(achievement.id)
                                    }
                                }
                            }
                        }
                        .padding(.horizontal, Spacing.md)
                    }
                    
                    // Narrative Tone Section
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Narrative Tone")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.primaryText)
                            .padding(.horizontal, Spacing.md)
                        
                        Picker("Tone", selection: $selectedTone) {
                            Text("Humble").tag(NarrativeTone.humble)
                            Text("Direct").tag(NarrativeTone.direct)
                            Text("Storyteller").tag(NarrativeTone.storyteller)
                        }
                        .pickerStyle(.segmented)
                        .padding(.horizontal, Spacing.md)
                    }
                    
                    // Generated Draft Section
                    if let draft = viewModel.generatedDraft {
                        VStack(alignment: .leading, spacing: Spacing.md) {
                            HStack {
                                Text("Generated Draft")
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.primaryText)
                                
                                Spacer()
                                
                                Text("\(draft.count) chars")
                                    .font(.caption)
                                    .foregroundColor(.secondaryText)
                            }
                            .padding(.horizontal, Spacing.md)
                            
                            ScrollView {
                                Text(draft)
                                    .font(.body)
                                    .foregroundColor(.primaryText)
                                    .lineSpacing(4)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(Spacing.md)
                                    .background(Color.appSecondaryBackground)
                                    .cornerRadius(CornerRadius.medium)
                            }
                            .frame(height: 300)
                            .padding(.horizontal, Spacing.md)
                            
                            HStack(spacing: Spacing.md) {
                                PrimaryButton("Copy to Clipboard", icon: "doc.on.clipboard") {
                                    viewModel.copyToClipboard()
                                }
                                
                                Button(action: {
                                    viewModel.regenerate()
                                }) {
                                    Image(systemName: "arrow.clockwise")
                                        .foregroundColor(.secondaryText)
                                        .font(.title3)
                                        .frame(width: 50, height: 50)
                                        .background(Color.appSecondaryBackground)
                                        .clipShape(Circle())
                                }
                            }
                            .padding(.horizontal, Spacing.md)
                        }
                    }
                    
                    // Regenerate Button
                    if viewModel.generatedDraft != nil {
                        PrimaryButton("Regenerate Post", icon: "sparkles") {
                            viewModel.regenerate()
                        }
                        .padding(.horizontal, Spacing.md)
                        .padding(.bottom, Spacing.xl)
                    }
                }
            }
        }
    }
}

struct AchievementRow: View {
    let achievement: AchievementModel
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: Spacing.md) {
                Text(achievement.text)
                    .font(.body)
                    .foregroundColor(.primaryText)
                    .multilineTextAlignment(.leading)
                
                Spacer()
                
                ZStack {
                    RoundedRectangle(cornerRadius: CornerRadius.small)
                        .stroke(isSelected ? Color.appPrimary : Color.tertiaryText, lineWidth: 2)
                        .frame(width: 24, height: 24)
                    
                    if isSelected {
                        Image(systemName: "checkmark")
                            .foregroundColor(.appPrimary)
                            .font(.caption)
                    }
                }
            }
            .padding(Spacing.md)
            .background(Color.appSecondaryBackground)
            .cornerRadius(CornerRadius.medium)
        }
    }
}

enum NarrativeTone: String {
    case humble = "Humble"
    case direct = "Direct"
    case storyteller = "Storyteller"
}

struct AchievementModel: Identifiable {
    let id = UUID()
    let text: String
}

#Preview {
    CVToPostConverterFlowView(viewModel: CVToPostConverterFlowViewModel())
}
