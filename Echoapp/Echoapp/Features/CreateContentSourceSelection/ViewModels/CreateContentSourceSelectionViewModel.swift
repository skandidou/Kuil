//
//  CreateContentSourceSelectionViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

struct ContentSource: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let icon: String
    let isAIPick: Bool
}

@MainActor
class CreateContentSourceSelectionViewModel: ObservableObject {
    @Published var sources: [ContentSource] = []
    @Published var otherMethods: [ContentSource] = []
    @Published var selectedSource: ContentSource?
    
    init() {
        loadSources()
    }
    
    func loadSources() {
        sources = [
            ContentSource(
                title: "From Idea",
                description: "Turn a quick thought into a polished post.",
                icon: "lightbulb.fill",
                isAIPick: false
            ),
            ContentSource(
                title: "From Link",
                description: "Repurpose an article or news story instantly.",
                icon: "link",
                isAIPick: false
            ),
            ContentSource(
                title: "From CV",
                description: "Extract professional insights from your history.",
                icon: "doc.text.fill",
                isAIPick: false
            ),
            ContentSource(
                title: "Daily Spark",
                description: "Fresh, personalized ideas based on your niche.",
                icon: "sparkles",
                isAIPick: true
            )
        ]
        
        otherMethods = [
            ContentSource(
                title: "From Video",
                description: "Convert video content to posts",
                icon: "video.fill",
                isAIPick: false
            )
        ]
    }
    
    func selectSource(_ source: ContentSource) {
        selectedSource = source
        NotificationCenter.default.post(name: .contentSourceSelected, object: source)
    }
    
    func showHelp() {
        // Handle help action
    }
}

extension Notification.Name {
    static let contentSourceSelected = Notification.Name("contentSourceSelected")
}
