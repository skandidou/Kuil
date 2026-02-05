//
//  FinalAIVoiceSyncingStatusViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

@MainActor
class FinalAIVoiceSyncingStatusViewModel: ObservableObject {
    
    func goToDashboard() {
        NotificationCenter.default.post(name: .voiceSyncComplete, object: nil)
    }
}

extension Notification.Name {
    static let voiceSyncComplete = Notification.Name("voiceSyncComplete")
}
