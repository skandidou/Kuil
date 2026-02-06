//
//  PersonalizationContext.swift
//  Kuil
//
//  Created by Skander Mabrouk on 23/01/2026.
//
//  Centralizes all user personalization data to be included in AI generation requests.
//  This ensures that persona, tone calibration, role, and voice signature are ALL used
//  when generating content - maximizing personalization.
//

import Foundation

/// Context object that captures all user personalization data for AI content generation
struct PersonalizationContext {
    let persona: String?              // "Visionary", "Practitioner", "Storyteller"
    let role: String?                 // "Founder", "Job Seeker", "Creator", etc.
    let tonePreferences: [Bool]?      // 12 boolean swipe results from calibration
    let voiceSignature: VoiceSignatureData?
    let topicPreferences: [String]?   // Selected topic interests from onboarding

    /// Creates a PersonalizationContext from the current AppState user profile
    @MainActor
    static func current() -> PersonalizationContext {
        let profile = AppState.shared.userProfile
        let topics = AppState.shared.selectedTopics
        return PersonalizationContext(
            persona: profile?.persona,
            role: profile?.role,
            tonePreferences: profile?.calibrationPreferences,
            voiceSignature: profile?.voiceSignature,
            topicPreferences: topics.isEmpty ? nil : topics
        )
    }

    /// Converts the context to a dictionary suitable for API requests
    func toDictionary() -> [String: Any] {
        var dict: [String: Any] = [:]

        if let persona = persona, !persona.isEmpty {
            dict["persona"] = persona
        }

        if let role = role, !role.isEmpty {
            dict["role"] = role
        }

        if let tones = tonePreferences, !tones.isEmpty {
            dict["calibrationPreferences"] = tones
        }

        if let voice = voiceSignature {
            dict["voiceSignature"] = [
                "formal": voice.formal,
                "bold": voice.bold,
                "empathetic": voice.empathetic,
                "complexity": voice.complexity,
                "brevity": voice.brevity,
                "primaryTone": voice.primaryTone
            ]
        }

        if let topics = topicPreferences, !topics.isEmpty {
            dict["topicPreferences"] = topics
        }

        return dict
    }

    /// Check if there's any personalization data available
    var hasData: Bool {
        return persona != nil || role != nil || tonePreferences != nil || voiceSignature != nil || topicPreferences != nil
    }

    /// Debug description for logging
    var debugDescription: String {
        var parts: [String] = []
        if let persona = persona { parts.append("persona=\(persona)") }
        if let role = role { parts.append("role=\(role)") }
        if let tones = tonePreferences { parts.append("calibration=\(tones.filter { $0 }.count)/\(tones.count) liked") }
        if voiceSignature != nil { parts.append("voiceSignature=present") }
        if let topics = topicPreferences { parts.append("topics=\(topics.count)") }
        return parts.isEmpty ? "no personalization" : parts.joined(separator: ", ")
    }
}
