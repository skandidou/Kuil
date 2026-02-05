//
//  FounderViralPostDatabaseViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

@MainActor
class FounderViralPostDatabaseViewModel: ObservableObject {
    @Published var categories: [String] = ["All", "Storytelling", "Opinion", "Frameworks"]
    @Published var hookPatterns: [HookPatternModel] = []
    
    init() {
        loadHookPatterns()
    }
    
    func loadHookPatterns() {
        hookPatterns = [
            HookPatternModel(
                authorName: "Jason Derulo • SaaS",
                authorInitials: "JD",
                authorColor: .appPrimary,
                metrics: "2.4M Impressions • 18k Likes",
                quote: "I quit my $500k/year VP job at Google to build a 'boring' SaaS company. Everyone said I was crazy. 6 months later, here's the truth about...",
                analysis: "Uses Pattern Interrupt by contrasting a high-status role with a 'boring' outcome. Builds immediate credibility through specific numbers ($500k).",
                isBookmarked: false,
                bookmarkAction: {},
                rewriteAction: {}
            ),
            HookPatternModel(
                authorName: "Sarah Lane • VC",
                authorInitials: "SL",
                authorColor: .purple,
                metrics: "890k Impressions • 4k Likes",
                quote: "Unpopular opinion: Most founders spend way too much time 'networking' and not enough time fixing their product-market fit. Here's why...",
                analysis: "Employs Negative Constraint. By attacking a common positive trait (networking), it creates friction that forces the reader to stop and disagree or validate.",
                isBookmarked: false,
                bookmarkAction: {},
                rewriteAction: {}
            ),
            HookPatternModel(
                authorName: "Mark Aris • AI",
                authorInitials: "MA",
                authorColor: .successGreen,
                metrics: "1.1M Impressions • 9k Likes",
                quote: "The 4-step framework I used to automate 80% of my client outreach without losing the human touch. (Steal this):",
                analysis: "Utilizes High Value Giveaway. The prompt for action ('Steal this') combined with a specific ROI (80% automated) triggers high save rates.",
                isBookmarked: false,
                bookmarkAction: {},
                rewriteAction: {}
            )
        ]
    }
    
    func back() {
        NotificationCenter.default.post(name: .databaseBack, object: nil)
    }
    
    func showFavorites() {
        // Handle favorites
    }
    
    func viewAll() {
        // Handle view all
    }
}

extension Notification.Name {
    static let databaseBack = Notification.Name("databaseBack")
}
