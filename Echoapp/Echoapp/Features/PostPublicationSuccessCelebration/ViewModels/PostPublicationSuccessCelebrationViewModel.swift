//
//  PostPublicationSuccessCelebrationViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

@MainActor
class PostPublicationSuccessCelebrationViewModel: ObservableObject {
    @Published var postPreview: String = "The future of AI ghostwriting is about preserving the unique voice of the founder. It's not just about content; it's about authentic resonance..."
    
    func viewOnLinkedIn() {
        // Open LinkedIn URL
        NotificationCenter.default.post(name: .viewOnLinkedIn, object: nil)
    }
}

extension Notification.Name {
    static let viewOnLinkedIn = Notification.Name("viewOnLinkedIn")
}
