//
//  WelcomeConnectLinkedInViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

@MainActor
class WelcomeConnectLinkedInViewModel: ObservableObject {
    @Published var isConnecting: Bool = false
    @Published var errorMessage: String?

    func connectLinkedIn() {
        isConnecting = true
        errorMessage = nil

        Task {
            do {
                // Real API call to LinkedIn OAuth
                _ = try await LinkedInService.shared.signIn(from: nil)

                isConnecting = false

                // Navigate to tone calibration (handled by ContentView)
                NotificationCenter.default.post(name: .linkedInConnected, object: nil)
            } catch {
                isConnecting = false
                errorMessage = "Failed to connect: \(error.localizedDescription)"
                print("❌ LinkedIn connection error: \(error)")
            }
        }
    }
}

extension Notification.Name {
    static let linkedInConnected = Notification.Name("linkedInConnected")
}
