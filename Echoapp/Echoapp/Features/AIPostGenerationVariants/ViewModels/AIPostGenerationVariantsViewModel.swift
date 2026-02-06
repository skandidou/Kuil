//
//  AIPostGenerationVariantsViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

@MainActor
class AIPostGenerationVariantsViewModel: ObservableObject {
    @Published var variants: [UIPostVariant] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?

    let topic: String

    init(topic: String = "startup growth tips") {
        self.topic = topic

        // Load real post variants
        Task {
            await generateVariants()
        }
    }

    func generateVariants() async {
        isLoading = true
        errorMessage = nil

        do {
            // Call Claude AI API to generate post variants
            let postVariants = try await ClaudeService.shared.generatePostVariants(from: topic)

            // Convert API PostVariant to UI UIPostVariant
            variants = postVariants.enumerated().map { index, variant in
                convertToUIVariant(variant, style: getStyleForIndex(index))
            }
        } catch {
            debugLog("❌ Error generating post variants: \(error)")
            errorMessage = "Failed to generate posts. Please try again."

            // Fallback to sample variants if API fails
            loadFallbackVariants()
        }

        isLoading = false
    }

    private func loadFallbackVariants() {
        variants = [
            UIPostVariant(
                style: .shortPunchy,
                rating: "HIGH IMPACT",
                score: 94,
                content: "Most founders wait too long to ship.\n\nPerfect is the enemy of revenue. I spent 6 months building my first MVP in silence. It failed in 6 days.\n\nNow, I ship when I'm still slightly embarrassed by the UI. That's where the growth happens.\n\nAgree or disagree?",
                hashtags: "#Founders #GrowthMindset #MVP",
                wordCount: "64",
                readTime: "25s",
                reach: "High"
            ),
            UIPostVariant(
                style: .detailedStory,
                rating: "HIGH IMPACT",
                score: 91,
                content: "The story of my first startup failure taught me more than any MBA ever could...",
                hashtags: "#StartupLife #Entrepreneurship #LessonsLearned",
                wordCount: "342",
                readTime: "2m",
                reach: "Very High"
            ),
            UIPostVariant(
                style: .educational,
                rating: "HIGH VALUE",
                score: 88,
                content: "Here's a framework I use to ship products faster without sacrificing quality...",
                hashtags: "#ProductManagement #Frameworks #SaaS",
                wordCount: "218",
                readTime: "1m 15s",
                reach: "High"
            )
        ]
    }

    private func convertToUIVariant(_ variant: PostVariant, style: VariantStyle) -> UIPostVariant {
        let wordCount = variant.content.split(separator: " ").count
        let readTime = "\(max(1, wordCount / 200))m"
        let rating = variant.hookScore >= 80 ? "HIGH IMPACT" : variant.hookScore >= 60 ? "MEDIUM IMPACT" : "NEEDS WORK"

        return UIPostVariant(
            style: style,
            rating: rating,
            score: variant.hookScore,
            content: variant.content,
            hashtags: extractHashtags(from: variant.content),
            wordCount: "\(wordCount)",
            readTime: readTime,
            reach: variant.estimatedEngagement ?? "Medium"
        )
    }

    private func getStyleForIndex(_ index: Int) -> VariantStyle {
        switch index {
        case 0: return .shortPunchy
        case 1: return .detailedStory
        default: return .educational
        }
    }

    private func extractHashtags(from content: String) -> String {
        let words = content.components(separatedBy: .whitespacesAndNewlines)
        let hashtags = words.filter { $0.hasPrefix("#") }
        return hashtags.isEmpty ? "#Business #LinkedIn" : hashtags.joined(separator: " ")
    }
    
    func getVariant(for style: VariantStyle) -> UIPostVariant? {
        variants.first { $0.style == style }
    }
    
    func back() {
        NotificationCenter.default.post(name: .variantsBack, object: nil)
    }
    
    func share() {
        // Handle share
    }
    
    func showMenu() {
        // Handle menu
    }
    
    func scheduleImmediately(_ variant: UIPostVariant) {
        NotificationCenter.default.post(name: .variantScheduled, object: variant)
    }
    
    func editDraft(_ variant: UIPostVariant) {
        NotificationCenter.default.post(name: .variantEditRequested, object: variant)
    }
    
    func regenerate(_ style: VariantStyle) {
        Task {
            await generateVariants()
        }
    }
}

extension Notification.Name {
    static let variantsBack = Notification.Name("variantsBack")
    static let variantScheduled = Notification.Name("variantScheduled")
    static let variantEditRequested = Notification.Name("variantEditRequested")
}
