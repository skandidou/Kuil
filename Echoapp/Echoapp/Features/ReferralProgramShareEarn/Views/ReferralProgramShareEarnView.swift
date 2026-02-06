//
//  ReferralProgramShareEarnView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct ReferralProgramShareEarnView: View {
    @ObservedObject var viewModel: ReferralProgramShareEarnViewModel
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
                        
                        Text("Referral Program")
                            .font(.headline)
                            .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            .frame(maxWidth: .infinity)
                        
                        Button(action: {
                            viewModel.showHelp()
                        }) {
                            Image(systemName: "questionmark.circle")
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                                .font(.headline)
                        }
                    }
                    .padding(.horizontal, Spacing.md)
                    .padding(.top, Spacing.md)
                    
                    // Promotional Banner
                    VStack(spacing: Spacing.md) {
                        ZStack {
                            Circle()
                                .fill(Color.successGreen.opacity(0.2))
                                .frame(width: 100, height: 100)
                            
                            Image(systemName: "party.popper.fill")
                                .font(.system(size: 50))
                                .foregroundColor(.successGreen)
                        }
                        
                        Text("Invite a founder, get 1 month of Pro free")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            .multilineTextAlignment(.center)
                        
                        Text("Share your unique link and unlock premium ghostwriting features for every successful referral.")
                            .font(.body)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, Spacing.lg)
                    }
                    .padding(.top, Spacing.lg)
                    
                    // Referral Link Section
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        Text("Your Referral Link")
                            .font(.headline)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                            .padding(.horizontal, Spacing.md)
                        
                        HStack(spacing: Spacing.md) {
                            Text(viewModel.referralLink)
                                .font(.body)
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                                .lineLimit(1)
                            
                            Spacer()
                            
                            Button(action: {
                                viewModel.copyLink()
                            }) {
                                Image(systemName: "doc.on.doc")
                                    .foregroundColor(.successGreen)
                                    .font(.callout)
                            }
                        }
                        .padding(Spacing.md)
                        .background(Color.adaptiveSecondaryBackground(colorScheme))
                        .cornerRadius(CornerRadius.medium)
                        .overlay(
                            RoundedRectangle(cornerRadius: CornerRadius.medium)
                                .stroke(Color.successGreen, lineWidth: 1)
                        )
                        .padding(.horizontal, Spacing.md)
                    }
                    
                    // Quick Share Section
                    VStack(spacing: Spacing.md) {
                        Text("QUICK SHARE")
                            .font(.caption)
                            .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                        
                        HStack(spacing: Spacing.lg) {
                            ShareButton(icon: "linkedin", label: "LinkedIn") {
                                viewModel.shareToLinkedIn()
                            }
                            
                            ShareButton(icon: "message.fill", label: "WhatsApp") {
                                viewModel.shareToWhatsApp()
                            }
                            
                            ShareButton(icon: "envelope.fill", label: "Email") {
                                viewModel.shareToEmail()
                            }
                            
                            ShareButton(icon: "ellipsis", label: "More") {
                                viewModel.shareMore()
                            }
                        }
                        .padding(.horizontal, Spacing.md)
                    }
                    .padding(.top, Spacing.md)
                    
                    // Referral Progress Section
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Referral Progress")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                            .padding(.horizontal, Spacing.md)
                        
                        PrimaryButton("Invite More Friends", icon: "person.badge.plus") {
                            viewModel.inviteMore()
                        }
                        .padding(.horizontal, Spacing.md)
                        
                        // Progress Bar
                        VStack(spacing: Spacing.sm) {
                            HStack {
                                Text("Next Milestone: \(viewModel.nextMilestone) Referrals")
                                    .font(.body)
                                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                                
                                Spacer()
                                
                                Text("\(viewModel.referralsNeeded) TO GO")
                                    .font(.headline)
                                    .foregroundColor(.successGreen)
                            }
                            .padding(.horizontal, Spacing.md)
                            
                            GeometryReader { geometry in
                                ZStack(alignment: .leading) {
                                    Rectangle()
                                        .fill(Color.adaptiveSecondaryBackground(colorScheme))
                                        .frame(height: 8)
                                        .cornerRadius(4)
                                    
                                    Rectangle()
                                        .fill(Color.successGreen)
                                        .frame(width: geometry.size.width * viewModel.progress, height: 8)
                                        .cornerRadius(4)
                                }
                            }
                            .frame(height: 8)
                            .padding(.horizontal, Spacing.md)
                            
                            HStack {
                                Text("0")
                                    .font(.caption)
                                    .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                                
                                Spacer()
                                
                                Text("\(viewModel.nextMilestone) FOUNDERS")
                                    .font(.caption)
                                    .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                            }
                            .padding(.horizontal, Spacing.md)
                        }
                        
                        // Info Card
                        HStack(spacing: Spacing.md) {
                            Image(systemName: "info.circle.fill")
                                .foregroundColor(.successGreen)
                                .font(.callout)
                            
                            Text("Your Pro subscription will be automatically extended once your friend upgrades their account.")
                                .font(.caption)
                                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                        }
                        .padding(Spacing.md)
                        .background(Color.successGreen.opacity(0.1))
                        .cornerRadius(CornerRadius.medium)
                        .overlay(
                            RoundedRectangle(cornerRadius: CornerRadius.medium)
                                .stroke(Color.successGreen, lineWidth: 1)
                        )
                        .padding(.horizontal, Spacing.md)
                    }
                    .padding(.top, Spacing.md)
                    .padding(.bottom, Spacing.xl)
                }
            }
        }
    }
}

struct ShareButton: View {
    let icon: String
    let label: String
    let action: () -> Void
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        Button(action: action) {
            VStack(spacing: Spacing.sm) {
                Image(systemName: icon)
                    .foregroundColor(.white)
                    .font(.title3)
                    .frame(width: 50, height: 50)
                    .background(Color.adaptiveSecondaryBackground(colorScheme))
                    .clipShape(Circle())
                
                Text(label)
                    .font(.caption)
                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
            }
            .frame(maxWidth: .infinity)
        }
    }
}

#Preview {
    ReferralProgramShareEarnView(viewModel: ReferralProgramShareEarnViewModel())
}
