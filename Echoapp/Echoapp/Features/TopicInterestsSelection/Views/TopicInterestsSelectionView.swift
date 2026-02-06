//
//  TopicInterestsSelectionView.swift
//  Kuil
//
//  Reddit-style topic selection for personalized AI content suggestions
//  User must select 3-10 topics they're interested in
//

import SwiftUI

struct TopicInterestsSelectionView: View {
    @Environment(\.colorScheme) var colorScheme
    @State private var selectedTopics: Set<String> = []
    @State private var isLoading: Bool = false
    @State private var searchText: String = ""

    var onComplete: ([String]) -> Void

    private let minTopics = 3
    private let maxTopics = 10

    // All available topics organized by category
    private let topicCategories: [(category: String, topics: [TopicItem])] = [
        ("Tech & Innovation", [
            TopicItem(id: "ai_ml", name: "AI & Machine Learning", icon: "brain.head.profile", color: "8B5CF6"),
            TopicItem(id: "startups", name: "Startups", icon: "rocket.fill", color: "F59E0B"),
            TopicItem(id: "saas", name: "SaaS", icon: "cloud.fill", color: "3B82F6"),
            TopicItem(id: "web3_crypto", name: "Web3 & Crypto", icon: "bitcoinsign.circle.fill", color: "F97316"),
            TopicItem(id: "product_management", name: "Product Management", icon: "square.stack.3d.up.fill", color: "EC4899"),
            TopicItem(id: "software_dev", name: "Software Development", icon: "chevron.left.forwardslash.chevron.right", color: "10B981"),
            TopicItem(id: "cybersecurity", name: "Cybersecurity", icon: "lock.shield.fill", color: "EF4444"),
            TopicItem(id: "data_science", name: "Data Science", icon: "chart.bar.fill", color: "6366F1"),
        ]),
        ("Business & Career", [
            TopicItem(id: "entrepreneurship", name: "Entrepreneurship", icon: "lightbulb.fill", color: "FBBF24"),
            TopicItem(id: "leadership", name: "Leadership", icon: "person.3.fill", color: "8B5CF6"),
            TopicItem(id: "sales", name: "Sales", icon: "dollarsign.circle.fill", color: "22C55E"),
            TopicItem(id: "marketing", name: "Marketing & Growth", icon: "megaphone.fill", color: "F43F5E"),
            TopicItem(id: "career_advice", name: "Career Advice", icon: "arrow.up.right.circle.fill", color: "0EA5E9"),
            TopicItem(id: "freelancing", name: "Freelancing", icon: "laptopcomputer", color: "A855F7"),
            TopicItem(id: "networking", name: "Networking", icon: "person.2.fill", color: "14B8A6"),
            TopicItem(id: "remote_work", name: "Remote Work", icon: "house.fill", color: "6366F1"),
        ]),
        ("Personal Development", [
            TopicItem(id: "productivity", name: "Productivity", icon: "bolt.fill", color: "F59E0B"),
            TopicItem(id: "mindset", name: "Mindset & Motivation", icon: "brain", color: "EC4899"),
            TopicItem(id: "public_speaking", name: "Public Speaking", icon: "mic.fill", color: "8B5CF6"),
            TopicItem(id: "writing", name: "Writing & Content", icon: "pencil.line", color: "3B82F6"),
            TopicItem(id: "health_wellness", name: "Health & Wellness", icon: "heart.fill", color: "EF4444"),
            TopicItem(id: "learning", name: "Learning & Education", icon: "book.fill", color: "10B981"),
        ]),
        ("Industry Specific", [
            TopicItem(id: "finance", name: "Finance & Investing", icon: "chart.line.uptrend.xyaxis", color: "22C55E"),
            TopicItem(id: "healthcare", name: "Healthcare", icon: "cross.case.fill", color: "EF4444"),
            TopicItem(id: "ecommerce", name: "E-commerce", icon: "cart.fill", color: "F97316"),
            TopicItem(id: "real_estate", name: "Real Estate", icon: "building.2.fill", color: "6366F1"),
            TopicItem(id: "media", name: "Media & Entertainment", icon: "play.rectangle.fill", color: "A855F7"),
            TopicItem(id: "sustainability", name: "Sustainability", icon: "leaf.fill", color: "22C55E"),
        ]),
        ("Content & Creativity", [
            TopicItem(id: "personal_branding", name: "Personal Branding", icon: "star.fill", color: "FBBF24"),
            TopicItem(id: "storytelling", name: "Storytelling", icon: "text.quote", color: "8B5CF6"),
            TopicItem(id: "thought_leadership", name: "Thought Leadership", icon: "lightbulb.max.fill", color: "F59E0B"),
            TopicItem(id: "social_media", name: "Social Media Strategy", icon: "bubble.left.and.bubble.right.fill", color: "0EA5E9"),
            TopicItem(id: "design", name: "Design & UX", icon: "paintpalette.fill", color: "EC4899"),
            TopicItem(id: "video_content", name: "Video Content", icon: "video.fill", color: "EF4444"),
        ]),
    ]

    private var filteredCategories: [(category: String, topics: [TopicItem])] {
        if searchText.isEmpty {
            return topicCategories
        }
        return topicCategories.compactMap { (categoryItem: (category: String, topics: [TopicItem])) -> (category: String, topics: [TopicItem])? in
            let filtered = categoryItem.topics.filter {
                $0.name.localizedCaseInsensitiveContains(searchText)
            }
            return filtered.isEmpty ? nil : (category: categoryItem.category, topics: filtered)
        }
    }

    private var canContinue: Bool {
        selectedTopics.count >= minTopics
    }

    var body: some View {
        ZStack {
            // Background
            LinearGradient(
                colors: [Color.adaptiveBackground(colorScheme), Color.adaptiveSecondaryBackground(colorScheme)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                VStack(spacing: 12) {
                    Text("What topics interest you?")
                        .font(.displaySmall)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                    Text("Select \(minTopics)-\(maxTopics) topics to personalize your AI suggestions")
                        .font(.subheadline)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                        .multilineTextAlignment(.center)

                    // Selection counter
                    HStack(spacing: 8) {
                        ForEach(0..<maxTopics, id: \.self) { index in
                            Circle()
                                .fill(index < selectedTopics.count ? Color.appPrimary : Color.adaptiveSeparator(colorScheme))
                                .frame(width: 8, height: 8)
                        }
                    }
                    .padding(.top, 8)

                    Text("\(selectedTopics.count) selected")
                        .font(.footnote).fontWeight(.medium)
                        .foregroundColor(canContinue ? Color.appPrimary : Color.adaptiveTertiaryText(colorScheme))
                }
                .padding(.horizontal, Spacing.lg)
                .padding(.top, Spacing.lg)
                .padding(.bottom, Spacing.md)

                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                    TextField("", text: $searchText)
                        .placeholder(when: searchText.isEmpty) {
                            Text("Search topics...")
                                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                        }
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                }
                .padding(Spacing.md)
                .background(
                    RoundedRectangle(cornerRadius: CornerRadius.medium)
                        .fill(Color.adaptiveSecondaryBackground(colorScheme))
                )
                .padding(.horizontal, Spacing.lg)
                .padding(.bottom, Spacing.md)

                // Topics grid
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: Spacing.lg) {
                        ForEach(filteredCategories, id: \.category) { category in
                            VStack(alignment: .leading, spacing: 12) {
                                Text(category.category)
                                    .font(.footnote).fontWeight(.semibold)
                                    .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                                    .textCase(.uppercase)

                                FlowLayout(spacing: 10) {
                                    ForEach(category.topics) { topic in
                                        topicChip(topic)
                                    }
                                }
                            }
                        }
                    }
                    .padding(.horizontal, Spacing.lg)
                    .padding(.bottom, 120)
                }

                // Bottom button
                VStack(spacing: 0) {
                    Divider()
                        .background(Color.adaptiveSeparator(colorScheme))

                    Button(action: saveAndContinue) {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.8)
                            } else {
                                Text("Continue")
                                    .font(.headline)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(
                            LinearGradient(
                                colors: canContinue
                                    ? [Color.appPrimary, Color(hex: "8B5CF6")]
                                    : [Color.adaptiveTertiaryText(colorScheme).opacity(0.3), Color.adaptiveTertiaryText(colorScheme).opacity(0.3)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .foregroundColor(.white)
                        .cornerRadius(CornerRadius.medium)
                    }
                    .disabled(!canContinue || isLoading)
                    .padding(.horizontal, Spacing.lg)
                    .padding(.vertical, Spacing.md)
                }
                .background(Color.adaptiveBackground(colorScheme).opacity(0.95))
            }
        }
    }

    @ViewBuilder
    private func topicChip(_ topic: TopicItem) -> some View {
        let isSelected = selectedTopics.contains(topic.id)

        Button(action: {
            toggleTopic(topic.id)
        }) {
            HStack(spacing: 8) {
                Image(systemName: topic.icon)
                    .font(.footnote)
                    .foregroundColor(isSelected ? .white : Color(hex: topic.color))

                Text(topic.name)
                    .font(.footnote).fontWeight(.medium)
                    .foregroundColor(isSelected ? .white : Color.adaptivePrimaryText(colorScheme))
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: CornerRadius.full)
                    .fill(isSelected ? Color(hex: topic.color) : Color.adaptiveOverlay(colorScheme))
                    .overlay(
                        RoundedRectangle(cornerRadius: CornerRadius.full)
                            .stroke(
                                isSelected ? Color.clear : Color(hex: topic.color).opacity(0.3),
                                lineWidth: 1
                            )
                    )
            )
        }
        .scaleEffect(isSelected ? 1.02 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isSelected)
    }

    private func toggleTopic(_ topicId: String) {
        if selectedTopics.contains(topicId) {
            selectedTopics.remove(topicId)
        } else if selectedTopics.count < maxTopics {
            selectedTopics.insert(topicId)
            // Haptic feedback
            let impact = UIImpactFeedbackGenerator(style: .light)
            impact.impactOccurred()
        }
    }

    private func saveAndContinue() {
        guard canContinue else { return }

        isLoading = true

        // Save to backend
        Task {
            do {
                let _: EmptyResponse = try await APIClient.shared.post(
                    endpoint: "/api/user/update-topics",
                    body: ["topics": Array(selectedTopics)]
                )
            } catch {
                print("Failed to save topics: \(error)")
            }

            await MainActor.run {
                isLoading = false
                onComplete(Array(selectedTopics))
            }
        }
    }
}

// Topic item model
struct TopicItem: Identifiable {
    let id: String
    let name: String
    let icon: String
    let color: String
}

// Flow layout for wrapping chips
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(in: proposal.width ?? 0, subviews: subviews, spacing: spacing)
        return CGSize(width: proposal.width ?? 0, height: result.height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(in: bounds.width, subviews: subviews, spacing: spacing)
        for (index, subview) in subviews.enumerated() {
            let point = CGPoint(x: bounds.minX + result.positions[index].x,
                              y: bounds.minY + result.positions[index].y)
            subview.place(at: point, proposal: .unspecified)
        }
    }

    struct FlowResult {
        var positions: [CGPoint] = []
        var height: CGFloat = 0

        init(in width: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var x: CGFloat = 0
            var y: CGFloat = 0
            var rowHeight: CGFloat = 0

            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)

                if x + size.width > width && x > 0 {
                    x = 0
                    y += rowHeight + spacing
                    rowHeight = 0
                }

                positions.append(CGPoint(x: x, y: y))
                rowHeight = max(rowHeight, size.height)
                x += size.width + spacing
            }

            height = y + rowHeight
        }
    }
}

#Preview {
    TopicInterestsSelectionView { topics in
        print("Selected: \(topics)")
    }
}
