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
    @Published var currentScore: Int = 0
    @Published var targetScore: Int = 85
    @Published var potentialGrowth: Int = 0
    @Published var progress: Double = 0.0
    @Published var insightText: String = "Analyzing your profile..."
    @Published var isLoading: Bool = true

    private var cancellables = Set<AnyCancellable>()

    init() {
        loadRealScore()
    }

    func loadRealScore() {
        // First check if stats already in AppState
        if let stats = AppState.shared.userStats {
            applyScore(stats.visibilityScore)
            return
        }

        // Otherwise fetch from API
        Task {
            do {
                let stats = try await UserService.shared.fetchStats()
                AppState.shared.userStats = stats
                applyScore(stats.visibilityScore)
            } catch {
                print("Failed to load visibility score: \(error)")
                // Fallback: still show something reasonable
                applyScore(35)
            }
        }
    }

    private func applyScore(_ score: Int) {
        let realScore = max(score, 1) // Ensure at least 1
        self.currentScore = realScore
        self.targetScore = min(max(realScore * 2, 60), 95) // Target = double (capped 60-95)
        self.potentialGrowth = targetScore > 0 ? Int(Double(targetScore - realScore) / Double(max(realScore, 1)) * 100) : 0
        self.insightText = generateInsight(score: realScore)
        self.isLoading = false
    }

    private func generateInsight(score: Int) -> String {
        if score < 30 {
            return "Your profile has untapped potential. Consistent posting with strong hooks will rapidly increase your visibility."
        } else if score < 50 {
            return "You have a solid foundation. Optimizing your posting schedule and content pillars can significantly boost your authority."
        } else if score < 70 {
            return "Great progress! Your content resonates well. Fine-tuning your hook style and posting frequency will push you further."
        } else {
            return "Impressive visibility! You're outperforming most professionals. Keep the momentum with consistent, high-quality posts."
        }
    }

    func animateScore() {
        let targetProgress = Double(currentScore) / 100.0
        withAnimation(.easeInOut(duration: 1.5)) {
            progress = targetProgress
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
