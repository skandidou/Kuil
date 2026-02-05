//
//  ToneCalibrationSwipeFlowViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

// MARK: - API Response Models

struct CalibrationPost: Codable {
    let tone: String
    let content: String
}

struct ToneCalibrationPostsResponse: Codable {
    let posts: [CalibrationPost]
}

struct VoiceCalibrationResponse: Codable {
    let success: Bool
    let message: String?
}

@MainActor
class ToneCalibrationSwipeFlowViewModel: ObservableObject {
    @Published var currentStep: Int = 1
    @Published var totalSteps: Int = 12 // Always 12 posts for proper calibration
    @Published var currentQuote: String?
    @Published var toneBadge: String = "ANALYTICAL TONE"
    @Published var hasSwiped: Bool = false
    @Published var isLoading: Bool = false
    @Published var isCompleted: Bool = false

    let isOnboarding: Bool
    private var calibrationPosts: [CalibrationPost] = [] // Posts with tone and content
    private var aiGeneratedPosts: [String] = [] // Just the content strings for saving
    private var userPreferences: [Bool] = [] // Track user swipes (true = like, false = skip)

    var progress: Double {
        Double(currentStep) / Double(totalSteps)
    }

    init(isOnboarding: Bool = false) {
        self.isOnboarding = isOnboarding
        // Always 12 posts for comprehensive calibration
        totalSteps = 12
        currentStep = 1

        // Generate AI posts for tone calibration
        Task {
            await generateAIPosts()
        }
    }

    func generateAIPosts() async {
        isLoading = true
        currentQuote = "Generating personalized posts..."

        do {
            print("🤖 Generating \(totalSteps) AI posts for tone calibration...")

            // Call backend with extended timeout (90 seconds for Claude Opus)
            let response: ToneCalibrationPostsResponse = try await APIClient.shared.postLongRunning(
                endpoint: "/api/voice/calibration-posts",
                body: ["count": totalSteps],
                timeoutSeconds: 90
            )

            print("📦 Received \(response.posts.count) posts from API")

            if response.posts.isEmpty {
                print("⚠️ API returned empty posts array, using fallback")
                useFallbackPosts()
            } else {
                calibrationPosts = response.posts
                aiGeneratedPosts = response.posts.map { $0.content }
                print("✅ Generated \(calibrationPosts.count) AI posts for calibration")
                loadCurrentQuote()
            }

        } catch {
            print("❌ Error generating AI posts: \(error.localizedDescription)")
            print("🔄 Using fallback posts instead...")
            useFallbackPosts()
        }

        isLoading = false
    }

    private func useFallbackPosts() {
        // Fallback to sample posts if API fails
        let fallbackContent = generateFallbackPosts()
        aiGeneratedPosts = fallbackContent

        // Create calibration posts with default tones for fallback
        let tones = [
            "ANALYTICAL", "INSPIRATIONAL", "CONVERSATIONAL", "AUTHORITATIVE",
            "EMPATHETIC", "DATA-DRIVEN", "STORYTELLING", "DIRECT",
            "THOUGHTFUL", "BOLD", "HUMBLE", "VISIONARY"
        ]
        calibrationPosts = fallbackContent.enumerated().map { index, content in
            CalibrationPost(tone: tones[index % tones.count], content: content)
        }

        print("📝 Loaded \(calibrationPosts.count) fallback posts")
        loadCurrentQuote()
    }

    func loadCurrentQuote() {
        // Load AI-generated post for current step
        let index = currentStep - 1

        print("📖 Loading quote for step \(currentStep), index \(index), calibrationPosts: \(calibrationPosts.count), aiGeneratedPosts: \(aiGeneratedPosts.count)")

        if index < calibrationPosts.count && !calibrationPosts[index].content.isEmpty {
            // Use calibration posts with tone info from API
            currentQuote = calibrationPosts[index].content
            toneBadge = formatToneBadge(calibrationPosts[index].tone)
            print("✅ Loaded calibration post: \(calibrationPosts[index].tone)")
        } else if index < aiGeneratedPosts.count && !aiGeneratedPosts[index].isEmpty {
            // Fallback to content-only posts
            currentQuote = aiGeneratedPosts[index]
            updateToneBadge(for: currentStep)
            print("✅ Loaded fallback post at index \(index)")
        } else {
            // Only show "completed" if we've actually gone through all steps
            if currentStep > totalSteps {
                currentQuote = "Calibration completed!"
                print("🎉 Calibration completed!")
            } else {
                // This shouldn't happen - use emergency fallback
                print("⚠️ No post available for index \(index), using emergency fallback")
                currentQuote = generateFallbackPosts()[index % 12]
                updateToneBadge(for: currentStep)
            }
        }
    }

    func formatToneBadge(_ tone: String) -> String {
        // Extract main tone type and format as badge
        let cleanTone = tone.components(separatedBy: "/").first ?? tone
        return cleanTone.uppercased().trimmingCharacters(in: .whitespaces) + " TONE"
    }

    func updateToneBadge(for step: Int) {
        let badges = [
            "ANALYTICAL TONE",
            "INSPIRATIONAL TONE",
            "CONVERSATIONAL TONE",
            "AUTHORITATIVE TONE",
            "EMPATHETIC TONE",
            "DATA-DRIVEN TONE",
            "STORYTELLING TONE",
            "DIRECT TONE",
            "THOUGHTFUL TONE",
            "BOLD TONE",
            "HUMBLE TONE",
            "VISIONARY TONE"
        ]
        toneBadge = badges[min(step - 1, badges.count - 1)]
    }

    func generateFallbackPosts() -> [String] {
        // Fallback sample posts with different tones for calibration
        return [
            "The systematic analysis of entrepreneurial setbacks reveals that 82% of early-stage pivots are driven by data-misinterpretation rather than market fit. We must stop romanticizing 'the grind' and start valuing 'the audit' of our internal processes.",
            "Here's the truth nobody talks about: Your network isn't your net worth. Your reputation is. And reputation is built one authentic interaction at a time, not through vanity metrics.",
            "I've learned that the best leaders don't have all the answers. They ask the best questions. What's one question you're wrestling with in your business right now?",
            "Three years ago, I was afraid to share my failures online. Today, my most vulnerable posts get the most engagement. Authenticity isn't a strategy—it's a responsibility.",
            "Stop waiting for permission to innovate. The market doesn't reward hesitation. It rewards action backed by data and guided by intuition.",
            "The best investment I ever made wasn't in crypto or real estate. It was in learning how to communicate complex ideas simply. Clarity is a competitive advantage.",
            "Most founders focus on product-market fit. Few focus on founder-market fit. Are you genuinely passionate about solving this problem for the next 10 years?",
            "I used to think delegation meant giving away tasks. Now I know it means giving away ownership. That shift changed everything about how I build teams.",
            "Your LinkedIn profile isn't a resume. It's a billboard for your expertise. Are you advertising the right message?",
            "The difference between good and great isn't talent. It's consistency. Show up every day, even when you don't feel like it.",
            "I've hired over 50 people. The best performers weren't the most experienced. They were the most curious.",
            "If your content doesn't make someone think, feel, or act differently, why are you posting it?"
        ]
    }

    func accept() {
        hasSwiped = true

        // Track user preference (liked this post)
        userPreferences.append(true)

        currentStep += 1

        if currentStep <= totalSteps {
            loadCurrentQuote()
            hasSwiped = false
            NotificationCenter.default.post(name: .toneCalibrationProgressed, object: nil)
        } else {
            // Calibration completed
            completeCalibration()
        }
    }

    func skip() {
        hasSwiped = true

        // Track user preference (didn't like this post)
        userPreferences.append(false)

        currentStep += 1

        if currentStep <= totalSteps {
            loadCurrentQuote()
            hasSwiped = false
        } else {
            // Calibration completed
            completeCalibration()
        }
    }

    func completeCalibration() {
        isCompleted = true

        // Save all preferences to backend
        // NOTE: Do NOT post .toneCalibrationCompleted here!
        // The notification should only be posted AFTER the user selects their role
        // in UserRoleSelectionView.saveAndContinue()
        Task {
            await saveUserPreferences()
        }
    }

    func saveUserPreferences() async {
        do {
            print("💾 Saving tone calibration preferences...")

            // Send user preferences to backend to refine voice profile
            let _: VoiceCalibrationResponse = try await APIClient.shared.post(
                endpoint: "/api/voice/calibration",
                body: [
                    "preferences": userPreferences,
                    "posts": aiGeneratedPosts
                ],
                requiresAuth: true
            )

            print("✅ Tone preferences saved successfully")
        } catch {
            print("❌ Failed to save preferences: \(error)")
        }
    }

    func cancel() {
        NotificationCenter.default.post(name: .toneCalibrationCancelled, object: nil)
    }

    func undo() {
        if currentStep > 1 && !isCompleted {
            currentStep -= 1
            // Remove last preference
            if !userPreferences.isEmpty {
                userPreferences.removeLast()
            }
            loadCurrentQuote()
            hasSwiped = false
        }
    }

    func showInfo() {
        // Handle info action
    }
}

extension Notification.Name {
    static let toneCalibrationProgressed = Notification.Name("toneCalibrationProgressed")
    static let toneCalibrationCompleted = Notification.Name("toneCalibrationCompleted")
    static let toneCalibrationCancelled = Notification.Name("toneCalibrationCancelled")
}
