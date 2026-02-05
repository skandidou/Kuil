//
//  ReferralProgramShareEarnViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

@MainActor
class ReferralProgramShareEarnViewModel: ObservableObject {
    @Published var referralLink: String = "li.ai/ref/alex_founder"
    @Published var currentReferrals: Int = 3
    @Published var nextMilestone: Int = 5
    @Published var referralsNeeded: Int = 2
    
    var progress: Double {
        Double(currentReferrals) / Double(nextMilestone)
    }
    
    func back() {
        NotificationCenter.default.post(name: .referralBack, object: nil)
    }
    
    func showHelp() {
        // Handle help
    }
    
    func copyLink() {
        // Handle copy
    }
    
    func shareToLinkedIn() {
        // Handle LinkedIn share
    }
    
    func shareToWhatsApp() {
        // Handle WhatsApp share
    }
    
    func shareToEmail() {
        // Handle Email share
    }
    
    func shareMore() {
        // Handle more share options
    }
    
    func inviteMore() {
        // Handle invite more
    }
}

extension Notification.Name {
    static let referralBack = Notification.Name("referralBack")
}
