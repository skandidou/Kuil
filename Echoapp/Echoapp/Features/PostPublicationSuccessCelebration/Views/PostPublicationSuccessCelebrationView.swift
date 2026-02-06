//
//  PostPublicationSuccessCelebrationView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct PostPublicationSuccessCelebrationView: View {
    @ObservedObject var viewModel: PostPublicationSuccessCelebrationViewModel
    @Environment(\.dismiss) var dismiss
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        ZStack {
            Color.adaptiveBackground(colorScheme)
                .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: Spacing.xl) {
                    // Close Button
                    HStack {
                        Spacer()
                        
                        Button(action: {
                            dismiss()
                        }) {
                            Image(systemName: "xmark")
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                                .font(.headline)
                                .frame(width: 32, height: 32)
                                .background(Color.adaptiveSecondaryBackground(colorScheme))
                                .clipShape(Circle())
                        }
                    }
                    .padding(.horizontal, Spacing.md)
                    .padding(.top, Spacing.md)
                    
                    // Success Icon
                    ZStack {
                        Circle()
                            .fill(Color.appPrimary.opacity(0.2))
                            .frame(width: 120, height: 120)
                        
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 80))
                            .foregroundColor(.appPrimary)
                        
                        // Celebration dots
                        ForEach(0..<6) { index in
                            Circle()
                                .fill(Color.appPrimary.opacity(0.6))
                                .frame(width: 8, height: 8)
                                .offset(
                                    x: cos(Double(index) * .pi / 3) * 70,
                                    y: sin(Double(index) * .pi / 3) * 70
                                )
                        }
                    }
                    .padding(.top, Spacing.lg)
                    
                    // Title
                    Text("Successfully Published!")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                    
                    // Description
                    Text("Your expert insights are now live on LinkedIn and reaching your network.")
                        .font(.body)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, Spacing.xl)
                    
                    // Post Preview Card
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        // Image placeholder
                        RoundedRectangle(cornerRadius: CornerRadius.medium)
                            .fill(
                                LinearGradient(
                                    colors: [Color.appPrimary.opacity(0.3), Color.appPrimary.opacity(0.1)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(height: 200)
                            .overlay(
                                Image(systemName: "photo")
                                    .font(.system(size: 50))
                                    .foregroundColor(.appPrimary.opacity(0.5))
                            )
                        
                        VStack(alignment: .leading, spacing: Spacing.sm) {
                            HStack(spacing: Spacing.xs) {
                                Image(systemName: "person.fill")
                                    .foregroundColor(.appPrimary)
                                    .font(.caption)
                                
                                Text("Founder Post Preview")
                                    .font(.caption)
                                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                            }
                            
                            Text(viewModel.postPreview)
                                .font(.body)
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                                .lineLimit(3)
                        }
                        .padding(Spacing.md)
                        
                        PrimaryButton("View on LinkedIn", icon: "arrow.up.right.square") {
                            viewModel.viewOnLinkedIn()
                        }
                        .padding(.horizontal, Spacing.md)
                        .padding(.bottom, Spacing.md)
                    }
                    .background(Color.adaptiveSecondaryBackground(colorScheme))
                    .cornerRadius(CornerRadius.medium)
                    .padding(.horizontal, Spacing.md)
                    
                    // Visibility Tip Card
                    HStack(spacing: Spacing.md) {
                        Image(systemName: "lightbulb.fill")
                            .foregroundColor(.appPrimary)
                            .font(.title3)
                        
                        VStack(alignment: .leading, spacing: Spacing.xs) {
                            Text("Visibility Tip")
                                .font(.headline)
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            
                            Text("Engaging with the first 3 comments can boost your reach by **20%**. Stay active to maximize impact!")
                                .font(.body)
                                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    .padding(Spacing.md)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.adaptiveSecondaryBackground(colorScheme))
                    .cornerRadius(CornerRadius.medium)
                    .padding(.horizontal, Spacing.md)
                    .padding(.bottom, Spacing.xl)
                }
            }
        }
    }
}

#Preview {
    PostPublicationSuccessCelebrationView(viewModel: PostPublicationSuccessCelebrationViewModel())
}
