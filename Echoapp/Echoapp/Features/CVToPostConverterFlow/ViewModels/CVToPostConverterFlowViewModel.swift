//
//  CVToPostConverterFlowViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

@MainActor
class CVToPostConverterFlowViewModel: ObservableObject {
    @Published var achievements: [AchievementModel] = []
    @Published var generatedDraft: String?
    
    init() {
        loadAchievements()
    }
    
    func loadAchievements() {
        achievements = [
            AchievementModel(text: "Led a team of 15 engineers to launch the MVP in 3 months."),
            AchievementModel(text: "Scaled annual recurring revenue by 40% through strategic partnerships."),
            AchievementModel(text: "Developed a proprietary AI algorithm for content optimization.")
        ]
        
        generatedDraft = """
        Launching a product in 3 months isn't just about speed. It's about clarity. 🚀
        
        When I led our engineering team of 15, we didn't just write code. We solved for the core user pain point first. By focusing on a proprietary AI algorithm, we cut through the noise.
        
        The result? A launch that didn't just meet deadlines but set a new standard for our technical excellence.
        
        What's your strategy for rapid iteration? 👇
        
        #Engineering #Startups #ProductManagement
        """
    }
    
    func back() {
        NotificationCenter.default.post(name: .cvConverterBack, object: nil)
    }
    
    func showHelp() {
        // Handle help
    }
    
    func browseFiles() {
        // Handle file selection
    }
    
    func copyToClipboard() {
        // Handle copy
    }
    
    func regenerate() {
        // Handle regenerate
    }
}

extension Notification.Name {
    static let cvConverterBack = Notification.Name("cvConverterBack")
}
