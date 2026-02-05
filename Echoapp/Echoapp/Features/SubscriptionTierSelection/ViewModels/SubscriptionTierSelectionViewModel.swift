//
//  SubscriptionTierSelectionViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

@MainActor
class SubscriptionTierSelectionViewModel: ObservableObject {
    @Published var selectedTier: SubscriptionTier = .pro
    @Published var billingPeriod: BillingPeriod = .annual
    
    func selectTier(_ tier: SubscriptionTier) {
        selectedTier = tier
    }
    
    func back() {
        NotificationCenter.default.post(name: .subscriptionBack, object: nil)
    }
    
    func startTrial() {
        // Handle subscription logic
        NotificationCenter.default.post(name: .subscriptionSelected, object: selectedTier)
    }
}

extension Notification.Name {
    static let subscriptionSelected = Notification.Name("subscriptionSelected")
    static let subscriptionBack = Notification.Name("subscriptionBack")
}
