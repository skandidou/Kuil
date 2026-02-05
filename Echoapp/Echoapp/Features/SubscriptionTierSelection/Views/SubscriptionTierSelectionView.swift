//
//  SubscriptionTierSelectionView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct SubscriptionTierSelectionView: View {
    @ObservedObject var viewModel: SubscriptionTierSelectionViewModel
    
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
                        
                        Text("Subscription Plans")
                            .font(.headline)
                            .foregroundColor(.primaryText)
                            .frame(maxWidth: .infinity)
                        
                        Spacer()
                    }
                    .padding(.horizontal, Spacing.md)
                    .padding(.top, Spacing.md)
                    
                    // Headline
                    VStack(spacing: Spacing.sm) {
                        Text("Elevate Your Authority")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.primaryText)
                        
                        Text("Select a plan to scale your personal brand on LinkedIn with AI.")
                            .font(.body)
                            .foregroundColor(.secondaryText)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, Spacing.lg)
                    }
                    .padding(.top, Spacing.md)
                    
                    // Billing Toggle
                    Picker("Billing", selection: $viewModel.billingPeriod) {
                        Text("Monthly").tag(BillingPeriod.monthly)
                        Text("Annual (-20%)").tag(BillingPeriod.annual)
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal, Spacing.lg)
                    
                    // Subscription Cards
                    VStack(spacing: Spacing.md) {
                        SubscriptionCard(
                            tier: .free,
                            billingPeriod: viewModel.billingPeriod,
                            isSelected: viewModel.selectedTier == .free
                        ) {
                            viewModel.selectTier(.free)
                        }
                        
                        SubscriptionCard(
                            tier: .starter,
                            billingPeriod: viewModel.billingPeriod,
                            isSelected: viewModel.selectedTier == .starter
                        ) {
                            viewModel.selectTier(.starter)
                        }
                        
                        SubscriptionCard(
                            tier: .pro,
                            billingPeriod: viewModel.billingPeriod,
                            isSelected: viewModel.selectedTier == .pro,
                            isPopular: true
                        ) {
                            viewModel.selectTier(.pro)
                        }
                        
                        SubscriptionCard(
                            tier: .founder,
                            billingPeriod: viewModel.billingPeriod,
                            isSelected: viewModel.selectedTier == .founder
                        ) {
                            viewModel.selectTier(.founder)
                        }
                    }
                    .padding(.horizontal, Spacing.md)
                    
                    // Footer
                    VStack(spacing: Spacing.md) {
                        Text("CANCEL ANYTIME. 100% SECURE.")
                            .font(.caption)
                            .foregroundColor(.secondaryText)
                        
                        HStack(spacing: Spacing.lg) {
                            Image(systemName: "lock.fill")
                            Image(systemName: "doc.text.fill")
                            Image(systemName: "shield.fill")
                        }
                        .foregroundColor(.secondaryText)
                        .font(.callout)
                        
                        PrimaryButton("Start 7-Day Free Trial") {
                            viewModel.startTrial()
                        }
                        .padding(.horizontal, Spacing.lg)
                        
                        Text("By subscribing, you agree to our Terms & Privacy Policy. Checkout secured via Apple App Store.")
                            .font(.caption2)
                            .foregroundColor(.tertiaryText)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, Spacing.xl)
                    }
                    .padding(.top, Spacing.lg)
                    .padding(.bottom, Spacing.xl)
                }
            }
        }
    }
}

struct SubscriptionCard: View {
    let tier: SubscriptionTier
    let billingPeriod: BillingPeriod
    let isSelected: Bool
    var isPopular: Bool = false
    let action: () -> Void
    
    var price: String {
        let monthlyPrice = tier.monthlyPrice
        let annualPrice = Int(Double(monthlyPrice) * 12 * 0.8)
        return billingPeriod == .monthly ? "$\(monthlyPrice)/mo" : "$\(annualPrice)/yr"
    }
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: Spacing.md) {
                HStack {
                    if isPopular {
                        BadgeView("MOST POPULAR")
                            .padding(.trailing, Spacing.sm)
                    }
                    
                    Text(tier.name)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.primaryText)
                    
                    Spacer()
                }
                
                Text(price)
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.primaryText)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    ForEach(tier.features, id: \.self) { feature in
                        HStack(spacing: Spacing.sm) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.appPrimary)
                                .font(.callout)
                            
                            Text(feature)
                                .font(.body)
                                .foregroundColor(.secondaryText)
                        }
                    }
                }
            }
            .padding(Spacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
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

enum SubscriptionTier {
    case free, starter, pro, founder
    
    var name: String {
        switch self {
        case .free: return "FREE"
        case .starter: return "STARTER"
        case .pro: return "PRO"
        case .founder: return "FOUNDER"
        }
    }
    
    var monthlyPrice: Int {
        switch self {
        case .free: return 0
        case .starter: return 29
        case .pro: return 79
        case .founder: return 199
        }
    }
    
    var features: [String] {
        switch self {
        case .free:
            return [
                "3 AI-generated posts per month",
                "Basic performance analytics"
            ]
        case .starter:
            return [
                "15 AI-generated posts",
                "Post scheduling & automation",
                "LinkedIn profile optimization"
            ]
        case .pro:
            return [
                "Unlimited AI posts",
                "Auto-posting & Smart Queuing",
                "Advanced Ghostwriting AI mode",
                "Real-time engagement AI"
            ]
        case .founder:
            return [
                "Custom AI model training",
                "Priority 24/7 VIP support",
                "Manage up to 5 accounts"
            ]
        }
    }
}

enum BillingPeriod {
    case monthly, annual
}

#Preview {
    SubscriptionTierSelectionView(viewModel: SubscriptionTierSelectionViewModel())
}
