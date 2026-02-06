//
//  DailySparkView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct DailySparkIdea: Codable, Identifiable {
    var id = UUID()
    let title: String
    let description: String
    let trend: String
    let engagementPotential: Int

    enum CodingKeys: String, CodingKey {
        case title, description, trend, engagementPotential
    }
}

struct DailySparkResponse: Codable {
    let ideas: [DailySparkIdea]
}

@MainActor
class DailySparkViewModel: ObservableObject {
    @Published var ideas: [DailySparkIdea] = []
    @Published var isLoading = false
    @Published var selectedIdea: DailySparkIdea?

    func loadDailyIdeas() async {
        isLoading = true

        do {
            debugLog("✨ Loading daily spark ideas...")

            let response: DailySparkResponse = try await APIClient.shared.get(
                endpoint: "/api/voice/daily-spark",
                requiresAuth: true
            )

            ideas = response.ideas
            debugLog("✅ Loaded \(ideas.count) daily spark ideas")
        } catch {
            debugLog("❌ Failed to load daily spark: \(error)")
            // Fallback ideas
            ideas = [
                DailySparkIdea(
                    title: "Share a lesson from your biggest career challenge",
                    description: "People connect with authentic stories of overcoming obstacles. Share what you learned.",
                    trend: "Authenticity in professional content",
                    engagementPotential: 75
                )
            ]
        }

        isLoading = false
    }

    func selectIdea(_ idea: DailySparkIdea) {
        selectedIdea = idea
        Task {
            // Generate post content from this idea
            await generatePostFromIdea(idea)
        }
    }

    func generatePostFromIdea(_ idea: DailySparkIdea) async {
        isLoading = true

        do {
            debugLog("🤖 Generating post from Daily Spark idea: \(idea.title)")

            struct GeneratePostResponse: Codable {
                let content: String
                let hookScore: Int
                let suggestions: [String]
            }

            let requestBody: [String: Any] = [
                "prompt": "\(idea.title)\n\n\(idea.description)\n\nTrend: \(idea.trend)",
                "sourceType": "Daily Spark"
            ]

            let response: GeneratePostResponse = try await APIClient.shared.post(
                endpoint: "/api/voice/generate",
                body: requestBody,
                requiresAuth: true
            )

            await MainActor.run {
                // Post notification with generated content
                NotificationCenter.default.post(
                    name: .dailySparkSelected,
                    object: ["idea": idea, "content": response.content, "hookScore": response.hookScore]
                )
            }

            debugLog("✅ Generated post from Daily Spark")
        } catch {
            debugLog("❌ Failed to generate post from Daily Spark: \(error)")
            await MainActor.run {
                selectedIdea = nil
            }
        }

        isLoading = false
    }

    func generateFromInspiration(topic: String, subtitle: String) async {
        isLoading = true

        do {
            debugLog("🤖 Generating post from inspiration: \(topic)")

            struct GeneratePostResponse: Codable {
                let content: String
                let hookScore: Int
                let suggestions: [String]
            }

            let requestBody: [String: Any] = [
                "prompt": "\(topic)\n\n\(subtitle)",
                "sourceType": "Daily Inspiration"
            ]

            let response: GeneratePostResponse = try await APIClient.shared.post(
                endpoint: "/api/voice/generate",
                body: requestBody,
                requiresAuth: true
            )

            await MainActor.run {
                // Post notification with generated content
                NotificationCenter.default.post(
                    name: .dailySparkSelected,
                    object: ["content": response.content, "hookScore": response.hookScore]
                )
            }

            debugLog("✅ Generated post from inspiration")
        } catch {
            debugLog("❌ Failed to generate post from inspiration: \(error)")
        }

        isLoading = false
    }
}

struct DailySparkView: View {
    @StateObject private var viewModel = DailySparkViewModel()
    @Environment(\.dismiss) var dismiss
    @Environment(\.colorScheme) var colorScheme
    @State private var showEditor = false
    @State private var editorViewModel: SmartAIEditorHookScorerViewModel?

    // Optional: Direct inspiration from dashboard
    let inspirationTopic: String?
    let inspirationSubtitle: String?

    init(inspirationTopic: String? = nil, inspirationSubtitle: String? = nil) {
        self.inspirationTopic = inspirationTopic
        self.inspirationSubtitle = inspirationSubtitle
    }

    var body: some View {
        ZStack {
            Color.adaptiveBackground(colorScheme).ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                header

                if viewModel.isLoading {
                    loadingView
                } else {
                    ScrollView {
                        VStack(spacing: Spacing.lg) {
                            // Hero section
                            heroSection
                                .padding(.horizontal, Spacing.lg)
                                .padding(.top, Spacing.lg)

                            // Ideas grid
                            LazyVStack(spacing: Spacing.md) {
                                ForEach(viewModel.ideas) { idea in
                                    ideaCard(idea)
                                }
                            }
                            .padding(.horizontal, Spacing.lg)
                            .padding(.bottom, Spacing.xl)
                        }
                    }
                }
            }
        }
        .task {
            // If inspiration topic is provided, auto-generate from it
            if let topic = inspirationTopic, let subtitle = inspirationSubtitle {
                await viewModel.generateFromInspiration(topic: topic, subtitle: subtitle)
            } else {
                await viewModel.loadDailyIdeas()
            }
        }
        .sheet(isPresented: $showEditor) {
            if let vm = editorViewModel {
                SmartAIEditorView(viewModel: vm)
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .dailySparkSelected)) { notification in
            if let data = notification.object as? [String: Any],
               let content = data["content"] as? String,
               let hookScore = data["hookScore"] as? Int {

                // Create editor view model with generated content
                let vm = SmartAIEditorHookScorerViewModel(sourceType: "Daily Spark")
                vm.content = content
                vm.hookScore = hookScore
                editorViewModel = vm

                showEditor = true
            }
        }
    }

    // MARK: - Header
    private var header: some View {
        HStack {
            Button(action: { dismiss() }) {
                HStack(spacing: Spacing.xs) {
                    Image(systemName: "chevron.left")
                    Text("Back")
                }
                .font(.headline)
                .foregroundColor(.appPrimary)
            }

            Spacer()

            VStack(spacing: 2) {
                Text("Daily Spark")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                Text("AI-Powered Ideas")
                    .font(.caption)
                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
            }

            Spacer()

            Button(action: {
                Task {
                    await viewModel.loadDailyIdeas()
                }
            }) {
                Image(systemName: "arrow.clockwise")
                    .font(.headline)
                    .foregroundColor(.appPrimary)
            }
        }
        .padding(.horizontal, Spacing.lg)
        .padding(.vertical, Spacing.md)
        .background(Color.adaptiveSecondaryBackground(colorScheme).opacity(0.5))
    }

    // MARK: - Hero Section
    private var heroSection: some View {
        VStack(spacing: Spacing.md) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [Color.yellow, Color.orange],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 80, height: 80)

                Image(systemName: "sparkles")
                    .font(.system(size: 40))
                    .foregroundColor(.white)
            }

            Text("Fresh Ideas, Every Day")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(Color.adaptivePrimaryText(colorScheme))

            Text("AI-generated post ideas based on current trends and your unique voice")
                .font(.callout)
                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                .multilineTextAlignment(.center)
                .padding(.horizontal, Spacing.xl)
        }
        .padding(.vertical, Spacing.xl)
        .frame(maxWidth: .infinity)
        .background(
            LinearGradient(
                colors: [Color.yellow.opacity(0.1), Color.orange.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(CornerRadius.large)
    }

    // MARK: - Idea Card
    private func ideaCard(_ idea: DailySparkIdea) -> some View {
        Button(action: {
            viewModel.selectIdea(idea)
        }) {
            VStack(alignment: .leading, spacing: Spacing.md) {
                // Engagement potential badge
                HStack {
                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill")
                            .font(.caption)
                        Text("\(idea.engagementPotential)% Potential")
                            .font(.caption)
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(engagementColor(idea.engagementPotential))
                    .padding(.horizontal, Spacing.sm)
                    .padding(.vertical, 4)
                    .background(engagementColor(idea.engagementPotential).opacity(0.15))
                    .cornerRadius(CornerRadius.small)

                    Spacer()

                    Image(systemName: "arrow.right")
                        .font(.caption)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                }

                // Title
                Text(idea.title)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                    .fixedSize(horizontal: false, vertical: true)

                // Description
                Text(idea.description)
                    .font(.callout)
                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                    .fixedSize(horizontal: false, vertical: true)

                // Trend tag
                HStack(spacing: Spacing.xs) {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                        .font(.caption2)
                    Text(idea.trend)
                        .font(.caption2)
                        .fontWeight(.medium)
                }
                .foregroundColor(.accentCyan)
                .padding(.horizontal, Spacing.sm)
                .padding(.vertical, 4)
                .background(Color.accentCyan.opacity(0.1))
                .cornerRadius(CornerRadius.small)
            }
            .padding(Spacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.adaptiveSecondaryBackground(colorScheme))
            .cornerRadius(CornerRadius.large)
            .overlay(
                RoundedRectangle(cornerRadius: CornerRadius.large)
                    .stroke(Color.accentCyan.opacity(0.2), lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }

    private func engagementColor(_ potential: Int) -> Color {
        if potential >= 75 {
            return .successGreen
        } else if potential >= 60 {
            return .orange
        } else {
            return .yellow
        }
    }

    // MARK: - Loading View
    private var loadingView: some View {
        VStack(spacing: Spacing.lg) {
            Spacer()

            ProgressView()
                .scaleEffect(1.5)

            Text("Generating fresh ideas for you...")
                .font(.callout)
                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))

            Spacer()
        }
    }
}

extension Notification.Name {
    static let dailySparkSelected = Notification.Name("dailySparkSelected")
}

#Preview {
    DailySparkView()
}
