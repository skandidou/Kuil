//
//  InitialVisibilityScoreRevealViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

@MainActor
class InitialVisibilityScoreRevealViewModel: ObservableObject {
    @Published var currentScore: Int = 42
    @Published var progress: Double = 0.42
    
    func animateScore() {
        withAnimation(.easeInOut(duration: 1.5)) {
            progress = 0.42
        }
    }
    
    func back() {
        NotificationCenter.default.post(name: .visibilityScoreBack, object: nil)
    }
    
    func viewDetailedMetrics() {
        NotificationCenter.default.post(name: .viewDetailedMetrics, object: nil)
    }
    
    func startDrafting() {
        NotificationCenter.default.post(name: .startDrafting, object: nil)
    }
    
    func showCalculation() {
        // Handle calculation info
    }
}

extension Notification.Name {
    static let visibilityScoreBack = Notification.Name("visibilityScoreBack")
    static let viewDetailedMetrics = Notification.Name("viewDetailedMetrics")
    static let startDrafting = Notification.Name("startDrafting")
}
