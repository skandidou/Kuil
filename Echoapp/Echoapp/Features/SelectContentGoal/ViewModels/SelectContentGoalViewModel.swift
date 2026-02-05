//
//  SelectContentGoalViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

struct ContentGoal: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let icon: String
    let isSuggested: Bool
}

@MainActor
class SelectContentGoalViewModel: ObservableObject {
    @Published var goals: [ContentGoal] = []
    @Published var selectedGoal: ContentGoal?
    
    init() {
        loadGoals()
    }
    
    func loadGoals() {
        goals = [
            ContentGoal(
                title: "Founder & CEO",
                description: "Lead generation focus. High-impact insights and company milestones to drive inquiries and authority.",
                icon: "rocket.fill",
                isSuggested: false
            ),
            ContentGoal(
                title: "Industry Expert",
                description: "Thought leadership focus. Deep dives into niche topics and educational threads to build a loyal following.",
                icon: "star.fill",
                isSuggested: true
            ),
            ContentGoal(
                title: "Job Seeker",
                description: "Personal branding focus. Highlighting skills, achievements, and industry knowledge to attract opportunities.",
                icon: "person.magnifyingglass",
                isSuggested: false
            )
        ]
        
        selectedGoal = goals.first { $0.isSuggested } ?? goals.first
    }
    
    func selectGoal(_ goal: ContentGoal) {
        selectedGoal = goal
    }
    
    func continueFlow() {
        guard let selectedGoal = selectedGoal else { return }
        NotificationCenter.default.post(name: .contentGoalSelected, object: selectedGoal)
    }
}

extension Notification.Name {
    static let contentGoalSelected = Notification.Name("contentGoalSelected")
}
