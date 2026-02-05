//
//  SmartAIEditorHookScorerViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

// MARK: - API Response Models

struct SinglePostResponse: Codable {
    let content: String
    let hookScore: Int
    let suggestions: [String]
}

struct SchedulePostResponse: Codable {
    let success: Bool
    let scheduledAt: String?
}

@MainActor
class SmartAIEditorHookScorerViewModel: ObservableObject {
    @Published var content: String = ""
    @Published var hookScore: Int = 0
    @Published var aiSuggestion: String? = nil
    @Published var isGenerating: Bool = false
    @Published var isSaving: Bool = false
    @Published var isCalculatingScore: Bool = false

    // Error handling
    @Published var errorMessage: String? = nil
    @Published var showError: Bool = false
    @Published var showSuccess: Bool = false
    @Published var successMessage: String = "Posted Successfully!"

    // Scheduling
    @Published var showSchedulePicker: Bool = false
    @Published var scheduledDate: Date = {
        // Default to tomorrow at 9 AM for better scheduling UX
        let calendar = Calendar.current
        let tomorrow = calendar.date(byAdding: .day, value: 1, to: Date()) ?? Date()
        return calendar.date(bySettingHour: 9, minute: 0, second: 0, of: tomorrow) ?? Date().addingTimeInterval(3600)
    }()

    let sourceType: String

    // Debounce timer for hook score calculation
    private var hookScoreDebounceTask: Task<Void, Never>?

    init(sourceType: String = "From Idea") {
        self.sourceType = sourceType
    }

    func generateContent(from prompt: String) {
        Task {
            await generatePostWithAI(prompt: prompt)
        }
    }

    func generatePostWithAI(prompt: String) async {
        isGenerating = true

        do {
            print("🤖 Generating post content with Gemini...")

            // Build request body with personalization
            var body: [String: Any] = [
                "prompt": prompt,
                "sourceType": sourceType
            ]

            // Include user personalization context
            let personalization = PersonalizationContext.current()
            body.merge(personalization.toDictionary()) { _, new in new }

            print("🎯 Generating with personalization: \(personalization.debugDescription)")

            // Call backend to generate post with AI
            let response: SinglePostResponse = try await APIClient.shared.post(
                endpoint: "/api/voice/generate",
                body: body
            )

            await MainActor.run {
                self.content = response.content
                self.hookScore = response.hookScore
                if !response.suggestions.isEmpty {
                    self.aiSuggestion = "AI Suggestion: \(response.suggestions.first!)"
                }
            }

            print("✅ Post generated with hook score: \(response.hookScore)")
        } catch {
            print("❌ Failed to generate post: \(error)")
            await MainActor.run {
                self.content = "Start writing your post here..."
                self.hookScore = 0
            }
        }

        isGenerating = false
    }

    func updateHookScore() {
        // Cancel any pending debounce
        hookScoreDebounceTask?.cancel()

        // Immediately calculate local score for instant feedback
        let localScore = calculateLocalHookScore(content)
        hookScore = localScore

        // Update suggestion based on local analysis
        aiSuggestion = generateLocalSuggestion(content, score: localScore)

        // Debounce API call for more accurate AI score (500ms delay)
        hookScoreDebounceTask = Task {
            try? await Task.sleep(nanoseconds: 500_000_000) // 500ms
            guard !Task.isCancelled else { return }
            await calculateHookScoreFromAPI()
        }
    }

    /// Local hook score calculation for instant feedback (adaptive per persona)
    private func calculateLocalHookScore(_ text: String) -> Int {
        guard !text.isEmpty else { return 0 }

        var score = 30 // Lower base score for stricter evaluation

        let words = text.split(separator: " ")
        let wordCount = words.count
        let firstLine = text.components(separatedBy: "\n").first ?? ""
        let lowercasedText = text.lowercased()
        let lowercasedFirstLine = firstLine.lowercased()

        // Get user's persona for adaptive scoring
        let persona = AppState.shared.userProfile?.persona

        // 1. Length check (ideal: 50-300 words)
        if wordCount >= 50 && wordCount <= 300 {
            score += 10
        } else if wordCount < 30 {
            score -= 10
        }

        // 2. Strong opening detection
        var hasStrongOpening = false

        // Questions are engaging
        if firstLine.contains("?") {
            score += 15
            hasStrongOpening = true
        }

        // Personal/direct openings
        if lowercasedFirstLine.starts(with: "i ") ||
           lowercasedFirstLine.starts(with: "most ") ||
           lowercasedFirstLine.starts(with: "here's ") ||
           lowercasedFirstLine.starts(with: "ever ") ||
           lowercasedFirstLine.starts(with: "what if ") {
            score += 10
            hasStrongOpening = true
        }

        // Penalty for weak opening (no hook detected)
        if !hasStrongOpening {
            score -= 15
        }

        // 3. Line breaks for readability
        let lineBreaks = text.components(separatedBy: "\n").count - 1
        if lineBreaks >= 2 && lineBreaks <= 8 {
            score += 10
        }

        // 4. High-impact power words only (more selective)
        let powerWords = ["proven", "secret", "mistake", "revealed", "breakthrough", "game-changer", "shocking"]
        let powerWordCount = powerWords.filter { lowercasedText.contains($0) }.count
        score += min(powerWordCount * 6, 12) // Reduced max bonus

        // 5. Call to action (required for engagement)
        let hasCTA = lowercasedText.contains("agree") ||
                     lowercasedText.contains("thoughts") ||
                     lowercasedText.contains("comment") ||
                     lowercasedText.contains("share") ||
                     lowercasedText.contains("what do you think") ||
                     lowercasedText.hasSuffix("?")
        if hasCTA {
            score += 12
        } else {
            score -= 10 // Penalty for no engagement signal
        }

        // 6. Emoji usage (moderate is good)
        let emojiPattern = try? NSRegularExpression(pattern: "[\\p{Emoji}]")
        let emojiCount = emojiPattern?.numberOfMatches(in: text, range: NSRange(text.startIndex..., in: text)) ?? 0
        if emojiCount >= 1 && emojiCount <= 3 {
            score += 5
        } else if emojiCount > 5 {
            score -= 5
        }

        // 7. Persona-specific bonuses (adaptive scoring)
        if let persona = persona {
            switch persona.lowercased() {
            case "visionary":
                // Future-focused, bold language
                if lowercasedText.contains("vision") ||
                   lowercasedText.contains("transform") ||
                   lowercasedText.contains("future") ||
                   lowercasedText.contains("next") ||
                   lowercasedText.contains("innovate") {
                    score += 8
                }
            case "practitioner":
                // Data-driven, specific, metrics-focused
                if lowercasedText.contains("increased") ||
                   lowercasedText.contains("achieved") ||
                   lowercasedText.contains("roi") ||
                   lowercasedText.contains("results") ||
                   lowercasedText.contains("data") ||
                   lowercasedText.contains("%") {
                    score += 8
                }
            case "storyteller":
                // Emotional, narrative, vulnerable
                if lowercasedText.contains("struggled") ||
                   lowercasedText.contains("learned") ||
                   lowercasedText.contains("journey") ||
                   lowercasedText.contains("story") ||
                   lowercasedFirstLine.starts(with: "i ") {
                    score += 8
                }
            default:
                break
            }
        }

        return min(max(score, 10), 100) // Clamp between 10-100
    }

    /// Generate suggestion based on local analysis
    private func generateLocalSuggestion(_ text: String, score: Int) -> String? {
        guard !text.isEmpty else { return nil }

        let firstLine = text.components(separatedBy: "\n").first ?? ""
        let wordCount = text.split(separator: " ").count

        if score < 40 {
            if wordCount < 30 {
                return "AI Suggestion: Your post is quite short. Add more context to engage readers."
            }
            if !firstLine.contains("?") && !firstLine.lowercased().contains("i ") {
                return "AI Suggestion: Start with a question or personal statement to hook readers."
            }
            return "AI Suggestion: Try adding a compelling question or bold statement at the start."
        } else if score < 70 {
            if !text.contains("\n\n") {
                return "AI Suggestion: Break up your text with line breaks for better readability."
            }
            if !(text.lowercased().contains("?") && text.contains("\n")) {
                return "AI Suggestion: End with a question to encourage engagement."
            }
            return "AI Suggestion: Consider adding a call-to-action like \"What do you think?\" or \"Agree?\""
        } else {
            return "AI Suggestion: Great hook! Your opening is engaging and likely to capture attention."
        }
    }

    func calculateHookScoreFromAPI() async {
        guard !content.isEmpty else {
            hookScore = 0
            return
        }

        isCalculatingScore = true

        do {
            print("📊 Calculating hook score from API...")

            struct HookScoreResponse: Codable {
                let score: Int
                let suggestion: String?
            }

            // Include personalization for more accurate scoring
            var body: [String: Any] = ["content": content]
            let personalization = PersonalizationContext.current()
            body.merge(personalization.toDictionary()) { _, new in new }

            let response: HookScoreResponse = try await APIClient.shared.post(
                endpoint: "/api/voice/hook-score",
                body: body
            )

            await MainActor.run {
                self.hookScore = response.score
                if let suggestion = response.suggestion, !suggestion.isEmpty {
                    self.aiSuggestion = "AI Suggestion: \(suggestion)"
                }
                self.isCalculatingScore = false
            }

            print("✅ Hook score from API: \(response.score)")
        } catch {
            print("❌ Failed to calculate hook score from API: \(error)")
            // Keep local score - don't reset
            await MainActor.run {
                self.isCalculatingScore = false
            }
        }
    }

    func back() {
        NotificationCenter.default.post(name: .editorBack, object: nil)
    }

    func post() {
        Task {
            await publishPost()
        }
    }

    func publishPost() async {
        guard !content.isEmpty else { return }
        isSaving = true
        errorMessage = nil

        do {
            print("📤 Publishing post to LinkedIn...")

            struct PublishResponse: Codable {
                let success: Bool
                let linkedinPostId: String?
            }

            // Use postNoRetry to prevent duplicate posts from retry mechanism
            let response: PublishResponse = try await APIClient.shared.postNoRetry(
                endpoint: "/api/posts/publish",
                body: ["content": content]
            )

            print("✅ Post published successfully: \(response.linkedinPostId ?? "unknown")")

            await MainActor.run {
                self.successMessage = "Posted Successfully!"
                self.showSuccess = true
                NotificationCenter.default.post(name: .editorPost, object: nil)
            }
        } catch let error as APIError {
            print("❌ Failed to publish post: \(error)")
            await MainActor.run {
                switch error {
                case .serverError(_, let message):
                    self.errorMessage = self.parseErrorMessage(message)
                case .networkError:
                    self.errorMessage = "Network error. Please check your connection."
                case .noToken:
                    self.errorMessage = "Please sign in again to publish."
                default:
                    self.errorMessage = "Failed to publish post. Please try again."
                }
                self.showError = true
            }
        } catch {
            print("❌ Failed to publish post: \(error)")
            await MainActor.run {
                self.errorMessage = "An unexpected error occurred. Please try again."
                self.showError = true
            }
        }

        isSaving = false
    }

    private func parseErrorMessage(_ json: String) -> String {
        // Check for LinkedIn duplicate content error first
        let lowercased = json.lowercased()
        if lowercased.contains("duplicate") || lowercased.contains("content is a duplicate") {
            return "This content was already posted to LinkedIn. Please modify your post before publishing again."
        }

        // Try to extract error message from JSON response
        if let data = json.data(using: .utf8),
           let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let message = dict["message"] as? String {
            // Also check parsed message for duplicate
            if message.lowercased().contains("duplicate") {
                return "This content was already posted to LinkedIn. Please modify your post before publishing again."
            }
            return message
        }
        if let data = json.data(using: .utf8),
           let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let error = dict["error"] as? String {
            // Also check parsed error for duplicate
            if error.lowercased().contains("duplicate") {
                return "This content was already posted to LinkedIn. Please modify your post before publishing again."
            }
            return error
        }
        return "Failed to publish post. Please try again."
    }

    func aiCleanup() {
        Task {
            await improveWithAI()
        }
    }

    func improveWithAI() async {
        guard !content.isEmpty else { return }
        isGenerating = true

        do {
            print("🤖 Improving post with AI...")

            // Build request body with personalization
            var body: [String: Any] = ["content": content]

            // Include user personalization context for style-aware improvements
            let personalization = PersonalizationContext.current()
            body.merge(personalization.toDictionary()) { _, new in new }

            let response: SinglePostResponse = try await APIClient.shared.post(
                endpoint: "/api/voice/improve",
                body: body
            )

            await MainActor.run {
                self.content = response.content
                self.hookScore = response.hookScore
                if !response.suggestions.isEmpty {
                    self.aiSuggestion = "AI Suggestion: \(response.suggestions.first!)"
                }
            }

            print("✅ Post improved with hook score: \(response.hookScore)")
        } catch {
            print("❌ Failed to improve post: \(error)")
        }

        isGenerating = false
    }

    func showOptions() {
        // Handle options (variants, etc.)
        NotificationCenter.default.post(name: .showPostVariants, object: content)
    }

    func schedule() {
        // Show date picker sheet instead of scheduling immediately
        showSchedulePicker = true
    }

    func confirmSchedule() {
        Task {
            await schedulePost()
        }
    }

    func schedulePost() async {
        guard !content.isEmpty else { return }
        isSaving = true
        errorMessage = nil

        do {
            print("📅 Scheduling post for: \(scheduledDate)")

            // Use postNoRetry to prevent duplicate scheduling from retry mechanism
            let response: SchedulePostResponse = try await APIClient.shared.postNoRetry(
                endpoint: "/api/posts/schedule",
                body: [
                    "content": content,
                    "scheduledAt": ISO8601DateFormatter().string(from: scheduledDate)
                ]
            )

            print("✅ Post scheduled for: \(response.scheduledAt ?? "unknown time")")

            await MainActor.run {
                self.showSchedulePicker = false
                self.successMessage = "Post Scheduled!"
                self.showSuccess = true
                NotificationCenter.default.post(name: .editorScheduled, object: nil)
            }
        } catch let error as APIError {
            print("❌ Failed to schedule post: \(error)")
            await MainActor.run {
                switch error {
                case .serverError(_, let message):
                    self.errorMessage = self.parseErrorMessage(message)
                case .networkError:
                    self.errorMessage = "Network error. Please check your connection."
                case .noToken:
                    self.errorMessage = "Please sign in again."
                default:
                    self.errorMessage = "Failed to schedule post. Please try again."
                }
                self.showError = true
            }
        } catch {
            print("❌ Failed to schedule post: \(error)")
            await MainActor.run {
                self.errorMessage = "An unexpected error occurred. Please try again."
                self.showError = true
            }
        }

        isSaving = false
    }

    func next() {
        NotificationCenter.default.post(name: .editorNext, object: nil)
    }
}

extension Notification.Name {
    static let editorBack = Notification.Name("editorBack")
    static let editorPost = Notification.Name("editorPost")
    static let editorNext = Notification.Name("editorNext")
    static let editorScheduled = Notification.Name("editorScheduled")
    static let showPostVariants = Notification.Name("showPostVariants")
}
