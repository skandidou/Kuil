//
//  MandatoryTonePersonaSelectionView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct MandatoryTonePersonaSelectionView: View {
    @ObservedObject var viewModel: MandatoryTonePersonaSelectionViewModel
    
    var body: some View {
        ZStack {
            Color.appBackground
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                HStack {
                    Text("ONBOARDING")
                        .font(.caption)
                        .foregroundColor(.tertiaryText)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    
                    Text("Step 1 of 3")
                        .font(.caption)
                        .foregroundColor(.tertiaryText)
                }
                .padding(.horizontal, Spacing.md)
                .padding(.top, Spacing.md)
                
                // Progress Bar
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.appSecondaryBackground)
                            .frame(height: 4)
                        
                        Rectangle()
                            .fill(Color.appPrimary)
                            .frame(width: geometry.size.width * 0.33, height: 4)
                    }
                }
                .frame(height: 4)
                .padding(.horizontal, Spacing.md)
                .padding(.top, Spacing.sm)
                
                ScrollView {
                    VStack(spacing: Spacing.xl) {
                        // Title
                        VStack(spacing: Spacing.sm) {
                            Text("Define Your Voice")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(.primaryText)
                            
                            Text("Select the persona that best matches your unique writing style on LinkedIn.")
                                .font(.body)
                                .foregroundColor(.secondaryText)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, Spacing.lg)
                        }
                        .padding(.top, Spacing.xl)
                        
                        // Persona Cards
                        VStack(spacing: Spacing.md) {
                            ForEach(viewModel.personas, id: \.id) { persona in
                                PersonaCard(
                                    persona: persona,
                                    isSelected: viewModel.selectedPersona?.id == persona.id
                                ) {
                                    viewModel.selectPersona(persona)
                                }
                            }
                        }
                        .padding(.horizontal, Spacing.md)
                        
                        // Continue Button
                        PrimaryButton("Continue to Calibration", icon: "arrow.right") {
                            viewModel.continueToCalibration()
                        }
                        .padding(.horizontal, Spacing.lg)
                        .padding(.top, Spacing.lg)
                        
                        // Footer
                        Text("You can refine your tone later in Profile Settings.")
                            .font(.caption)
                            .foregroundColor(.tertiaryText)
                            .padding(.top, Spacing.md)
                            .padding(.bottom, Spacing.xl)
                    }
                }
            }
        }
    }
}

struct PersonaCard: View {
    let persona: Persona
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: Spacing.md) {
                HStack(spacing: Spacing.sm) {
                    Text(persona.category)
                        .font(.caption)
                        .foregroundColor(.accentLightBlue)
                    
                    Spacer()
                }
                
                HStack(spacing: Spacing.md) {
                    // Icon
                    ZStack {
                        Circle()
                            .fill(Color.appPrimary.opacity(0.2))
                            .frame(width: 50, height: 50)
                        
                        Image(systemName: persona.icon)
                            .foregroundColor(.appPrimary)
                            .font(.title3)
                    }
                    
                    // Content
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        Text(persona.title)
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.primaryText)
                        
                        Text(persona.description)
                            .font(.body)
                            .foregroundColor(.secondaryText)
                    }
                    
                    Spacer()
                }
                
                // Example Quote
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    Text(persona.exampleQuote)
                        .font(.callout)
                        .foregroundColor(.secondaryText)
                        .italic()
                        .padding(Spacing.md)
                        .background(Color.appBackground)
                        .cornerRadius(CornerRadius.small)
                }
                
                if isSelected {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.appPrimary)
                        Text("Selected")
                            .font(.caption)
                            .foregroundColor(.appPrimary)
                    }
                }
            }
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

#Preview {
    MandatoryTonePersonaSelectionView(viewModel: MandatoryTonePersonaSelectionViewModel())
}
