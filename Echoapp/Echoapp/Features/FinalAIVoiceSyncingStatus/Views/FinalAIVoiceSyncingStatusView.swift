//
//  FinalAIVoiceSyncingStatusView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct FinalAIVoiceSyncingStatusView: View {
    @ObservedObject var viewModel: FinalAIVoiceSyncingStatusViewModel
    
    var body: some View {
        ZStack {
            Color.appBackground
                .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: Spacing.xl) {
                    // Header
                    HStack {
                        Spacer()
                    }
                    .padding(.horizontal, Spacing.md)
                    .padding(.top, Spacing.md)
                    
                    // Success Icon
                    ZStack {
                        Circle()
                            .fill(Color.appPrimary.opacity(0.2))
                            .frame(width: 80, height: 80)
                        
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.appPrimary)
                    }
                    .padding(.top, Spacing.lg)
                    
                    // Title
                    Text("VoiceSync Status")
                        .font(.title)
                        .foregroundColor(.primaryText)
                    
                    Text("VoiceSignature™ Finalized")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.primaryText)
                    
                    Text("Your AI co-pilot is now 100% synced with your unique executive style.")
                        .font(.body)
                        .foregroundColor(.secondaryText)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, Spacing.xl)
                    
                    // Match Badge
                    HStack(spacing: Spacing.xs) {
                        Text("DIRECTNESS")
                            .font(.caption)
                            .foregroundColor(.tertiaryText)
                        
                        BadgeView("100% MATCH", color: .appPrimary)
                    }
                    .padding(.top, Spacing.md)
                    
                    // Radar Chart Placeholder
                    RoundedRectangle(cornerRadius: CornerRadius.medium)
                        .fill(Color.appSecondaryBackground)
                        .frame(width: 250, height: 250)
                        .overlay(
                            VStack {
                                Text("Voice Signature Radar")
                                    .foregroundColor(.secondaryText)
                                Text("Directness • Humor • Complexity • Empathy")
                                    .font(.caption)
                                    .foregroundColor(.tertiaryText)
                            }
                        )
                        .padding(.top, Spacing.md)
                    
                    // Dominant Attributes
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("DOMINANT ATTRIBUTES")
                            .font(.caption)
                            .foregroundColor(.tertiaryText)
                        
                        HStack(spacing: Spacing.md) {
                            // Primary Trait
                            VStack(alignment: .leading, spacing: Spacing.sm) {
                                HStack {
                                    Image(systemName: "bolt.fill")
                                        .foregroundColor(.appPrimary)
                                        .font(.callout)
                                    
                                    Spacer()
                                }
                                
                                Text("PRIMARY TRAIT")
                                    .font(.caption2)
                                    .foregroundColor(.tertiaryText)
                                
                                Text("Direct")
                                    .font(.title)
                                    .fontWeight(.bold)
                                    .foregroundColor(.primaryText)
                            }
                            .padding(Spacing.md)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.appSecondaryBackground)
                            .cornerRadius(CornerRadius.medium)
                            
                            // Secondary Trait
                            VStack(alignment: .leading, spacing: Spacing.sm) {
                                HStack {
                                    Image(systemName: "heart.fill")
                                        .foregroundColor(.appPrimary)
                                        .font(.callout)
                                    
                                    Spacer()
                                }
                                
                                Text("SECONDARY TRAIT")
                                    .font(.caption2)
                                    .foregroundColor(.tertiaryText)
                                
                                Text("Empathetic")
                                    .font(.title)
                                    .fontWeight(.bold)
                                    .foregroundColor(.primaryText)
                            }
                            .padding(Spacing.md)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.appSecondaryBackground)
                            .cornerRadius(CornerRadius.medium)
                        }
                    }
                    .padding(.horizontal, Spacing.md)
                    .padding(.top, Spacing.lg)
                    
                    // CTA Button
                    PrimaryButton("Take me to my Dashboard", icon: "arrow.right") {
                        viewModel.goToDashboard()
                    }
                    .padding(.horizontal, Spacing.lg)
                    .padding(.top, Spacing.lg)
                    
                    // Footer
                    Text("Calibration complete. Ghostwriting engine active.")
                        .font(.caption)
                        .foregroundColor(.tertiaryText)
                        .padding(.top, Spacing.md)
                        .padding(.bottom, Spacing.xl)
                }
            }
        }
    }
}

#Preview {
    FinalAIVoiceSyncingStatusView(viewModel: FinalAIVoiceSyncingStatusViewModel())
}
