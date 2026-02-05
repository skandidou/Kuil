//
//  MandatoryTonePersonaSelectionViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

struct Persona: Identifiable {
    let id = UUID()
    let title: String
    let category: String
    let description: String
    let exampleQuote: String
    let icon: String
}

@MainActor
class MandatoryTonePersonaSelectionViewModel: ObservableObject {
    @Published var personas: [Persona] = []
    @Published var selectedPersona: Persona?
    
    init() {
        loadPersonas()
    }
    
    func loadPersonas() {
        personas = [
            Persona(
                title: "The Visionary",
                category: "STRATEGIC",
                description: "Bold, future-focused, and industry-disrupting. Perfect for category kings.",
                exampleQuote: "\"The future belongs to those who automate today. Here is why most founders are missing the mark...\"",
                icon: "rocket.fill"
            ),
            Persona(
                title: "The Practitioner",
                category: "ANALYTICAL",
                description: "Data-driven, tactical, and metrics-heavy. Focus on actionable insights.",
                exampleQuote: "\"I increased CTR by 40% using these three frameworks. Step 1: Audit your existing hooks...\"",
                icon: "chart.bar.fill"
            ),
            Persona(
                title: "The Storyteller",
                category: "AUTHENTIC",
                description: "Vulnerable, anecdotal, and human. Building deep trust through stories.",
                exampleQuote: "\"My biggest failure wasn't losing the client; it was losing my 'why'. Here is what I learned...\"",
                icon: "book.fill"
            )
        ]
        
        selectedPersona = personas.first
    }
    
    func selectPersona(_ persona: Persona) {
        selectedPersona = persona
    }

    func continueToCalibration() {
        guard let selectedPersona = selectedPersona else { return }

        // Save persona to backend (fire and forget)
        Task {
            await savePersonaToBackend(selectedPersona)
        }

        NotificationCenter.default.post(name: .personaSelected, object: selectedPersona)
    }

    /// Save persona selection to backend API
    private func savePersonaToBackend(_ persona: Persona) async {
        // Map persona title to backend enum value
        let personaValue: String
        switch persona.title {
        case "The Visionary":
            personaValue = "Visionary"
        case "The Practitioner":
            personaValue = "Practitioner"
        case "The Storyteller":
            personaValue = "Storyteller"
        default:
            personaValue = "Practitioner"
        }

        do {
            let _: EmptyResponse = try await APIClient.shared.post(
                endpoint: "/api/user/update-persona",
                body: ["persona": personaValue],
                requiresAuth: true
            )
            print("✅ Persona saved to backend: \(personaValue)")
        } catch {
            print("⚠️ Failed to save persona (non-blocking): \(error.localizedDescription)")
            // Non-blocking - continue with onboarding even if this fails
        }
    }
}


extension Notification.Name {
    static let personaSelected = Notification.Name("personaSelected")
}
