//
//  ClaudeService.swift
//  Kuil
//
//  Created by Claude on 16/01/2026.
//

import Foundation

/// AI Service powered by Claude (Anthropic)
/// Uses Claude Opus 4 for complex tasks, Sonnet 4 for medium, Haiku 3.5 for simple/fast
@MainActor
class ClaudeService: ObservableObject {
    static let shared = ClaudeService()

    @Published var voiceSignature: VoiceSignature?
    @Published var isAnalyzing = false

    private init() {}

    // MARK: - Voice Analysis

    /// Analyze LinkedIn posts to generate voice signature
    func analyzeVoiceSignature() async throws -> VoiceSignature {
        isAnalyzing = true

        defer {
            isAnalyzing = false
        }

        // Backend returns VoiceSignature directly (flat structure)
        let signature: VoiceSignature = try await APIClient.shared.post(
            endpoint: Config.Endpoints.voiceAnalyze,
            body: [:]
        )

        voiceSignature = signature

        return signature
    }

    /// Get current voice signature (cached on server)
    func fetchVoiceSignature() async throws -> VoiceSignature? {
        // Backend returns VoiceSignature directly (flat structure)
        let signature: VoiceSignature = try await APIClient.shared.get(
            endpoint: Config.Endpoints.voiceSignature
        )

        voiceSignature = signature

        return signature
    }

    // MARK: - Content Generation

    /// Generate post variants from a topic - AUTOMATICALLY includes user personalization
    func generatePostVariants(from topic: String) async throws -> [PostVariant] {
        var body: [String: Any] = ["topic": topic]

        // Automatically include personalization context
        let personalization = PersonalizationContext.current()
        body.merge(personalization.toDictionary()) { _, new in new }

        print("🎯 Generating with personalization: \(personalization.debugDescription)")

        let response: GeneratePostResponse = try await APIClient.shared.post(
            endpoint: Config.Endpoints.voiceGenerate,
            body: body
        )

        return response.variants
    }

    /// Generate post variants with additional context - AUTOMATICALLY includes user personalization
    func generatePostVariants(
        topic: String,
        tone: String? = nil,
        length: String? = nil
    ) async throws -> [PostVariant] {
        var body: [String: Any] = ["topic": topic]

        if let tone = tone {
            body["tone"] = tone
        }
        if let length = length {
            body["length"] = length
        }

        // Automatically include personalization context
        let personalization = PersonalizationContext.current()
        body.merge(personalization.toDictionary()) { _, new in new }

        print("🎯 Generating with personalization: \(personalization.debugDescription)")

        let response: GeneratePostResponse = try await APIClient.shared.post(
            endpoint: Config.Endpoints.voiceGenerate,
            body: body
        )

        return response.variants
    }
}

// MARK: - Models

struct VoiceSignature: Codable {
    let formal: Double
    let bold: Double
    let empathetic: Double
    let complexity: Double
    let brevity: Double
    let primaryTone: String
    let confidence: Double

    // Backend returns "primaryTone" not "primary_tone"
    enum CodingKeys: String, CodingKey {
        case formal
        case bold
        case empathetic
        case complexity
        case brevity
        case primaryTone
        case confidence
    }

    /// Get values as array for radar chart
    var radarValues: [Double] {
        [formal, bold, empathetic, complexity, brevity]
    }

    /// Get dimension labels
    static var dimensionLabels: [String] {
        ["FORMAL", "BOLD", "EMPATHETIC", "COMPLEXITY", "BREVITY"]
    }
}

struct PostVariant: Codable, Identifiable {
    let id: String
    let content: String
    let hookScore: Int
    let tone: String?
    let estimatedEngagement: String?

    enum CodingKeys: String, CodingKey {
        case id
        case content
        case hookScore = "hook_score"
        case tone
        case estimatedEngagement = "estimated_engagement"
    }

    /// Hook score color based on value
    var hookScoreColor: String {
        switch hookScore {
        case 0..<40: return "errorRed"
        case 40..<70: return "warningYellow"
        default: return "successGreen"
        }
    }

    /// Hook score message
    var hookScoreMessage: String {
        switch hookScore {
        case 0..<40: return "Needs work. Try a stronger opening."
        case 40..<70: return "Good start! Consider adding intrigue."
        default: return "Great! Your hook is engaging."
        }
    }
}

// MARK: - Response Models

// VoiceSignatureResponse now IS the VoiceSignature since backend returns flat structure
// Using typealias for backwards compatibility
typealias VoiceSignatureResponse = VoiceSignature

struct GeneratePostResponse: Codable {
    let variants: [PostVariant]
    let topic: String?
}

// MARK: - Errors

enum ClaudeError: Error {
    case noVoiceSignature
    case analysisInProgress
    case invalidTopic
}

// MARK: - Backward Compatibility
/// Typealias for backward compatibility with existing code
typealias GeminiService = ClaudeService
typealias GeminiError = ClaudeError
