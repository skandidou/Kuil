//
//  ProfileScopeResultView.swift
//  Kuil
//
//  "Profilescope" - Fun personality-style analysis result screen
//  Shows "You are like...", "You write like...", personality traits
//

import SwiftUI

struct ProfileScopeResultView: View {
    @Environment(\.colorScheme) var colorScheme
    @State private var voiceSignature: VoiceSignatureResponse?
    @State private var isLoading: Bool = true
    @State private var showContent: Bool = false
    @State private var animateTraits: Bool = false

    var onComplete: () -> Void

    // Personality archetypes based on voice signature
    private var archetype: ProfileArchetype {
        guard let voice = voiceSignature else {
            return ProfileArchetype.default
        }

        // Determine archetype based on dominant traits
        if voice.bold >= 7 && voice.formal <= 4 {
            return .disruptor
        } else if voice.empathetic >= 7 && voice.formal <= 5 {
            return .storyteller
        } else if voice.formal >= 7 && voice.complexity >= 6 {
            return .thought_leader
        } else if voice.bold >= 6 && voice.brevity >= 7 {
            return .straight_shooter
        } else if voice.empathetic >= 6 && voice.complexity <= 4 {
            return .connector
        } else if voice.complexity >= 7 {
            return .analyst
        } else {
            return .versatile
        }
    }

    // Famous person comparison based on writing style
    // Uses a scoring system to find the best match across all traits
    private var writesLike: (name: String, description: String, emoji: String) {
        guard let voice = voiceSignature else {
            return ("A Professional", "Clear and effective communicator", "✍️")
        }

        // Define influencer profiles with their ideal voice signatures
        let influencers: [(name: String, description: String, emoji: String, profile: (formal: Double, bold: Double, empathetic: Double, complexity: Double, brevity: Double))] = [
            ("Elon Musk", "Bold, direct, and unapologetically provocative", "🚀", (formal: 3, bold: 9, empathetic: 3, complexity: 6, brevity: 7)),
            ("Brené Brown", "Vulnerable, human, and deeply relatable", "💝", (formal: 4, bold: 5, empathetic: 9, complexity: 5, brevity: 4)),
            ("Simon Sinek", "Thoughtful, strategic, and inspiring", "🎯", (formal: 7, bold: 6, empathetic: 7, complexity: 6, brevity: 5)),
            ("Naval Ravikant", "Concise, wise, and impactful", "💎", (formal: 5, bold: 6, empathetic: 4, complexity: 7, brevity: 9)),
            ("Gary Vaynerchuk", "Energetic, motivational, and real", "🔥", (formal: 2, bold: 8, empathetic: 7, complexity: 3, brevity: 6)),
            ("Seth Godin", "Insightful, creative, and thought-provoking", "💡", (formal: 6, bold: 7, empathetic: 5, complexity: 7, brevity: 6)),
            ("Tim Ferriss", "Curious, experimental, and practical", "⚡", (formal: 5, bold: 6, empathetic: 5, complexity: 6, brevity: 5)),
            ("Malcolm Gladwell", "Engaging, analytical, and accessible", "📚", (formal: 6, bold: 4, empathetic: 6, complexity: 7, brevity: 4)),
            ("Adam Grant", "Evidence-based, generous, and relatable", "🧠", (formal: 6, bold: 5, empathetic: 8, complexity: 6, brevity: 5)),
            ("Marie Forleo", "Energetic, warm, and action-oriented", "✨", (formal: 4, bold: 7, empathetic: 8, complexity: 4, brevity: 6)),
            ("James Clear", "Simple, practical, and habit-focused", "📝", (formal: 5, bold: 5, empathetic: 6, complexity: 4, brevity: 8)),
            ("Sahil Bloom", "Curiosity-driven, visual, and growth-minded", "🌱", (formal: 4, bold: 6, empathetic: 6, complexity: 5, brevity: 7))
        ]

        // Calculate similarity score for each influencer (lower = more similar)
        var bestMatch = influencers[0]
        var bestScore = Double.infinity

        for influencer in influencers {
            let score = abs(voice.formal - influencer.profile.formal) +
                        abs(voice.bold - influencer.profile.bold) +
                        abs(voice.empathetic - influencer.profile.empathetic) +
                        abs(voice.complexity - influencer.profile.complexity) +
                        abs(voice.brevity - influencer.profile.brevity)

            if score < bestScore {
                bestScore = score
                bestMatch = influencer
            }
        }

        return (bestMatch.name, bestMatch.description, bestMatch.emoji)
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

            if isLoading {
                LoadingView("Analyzing your profile...", subtitle: "Discovering your unique voice")
            } else {
                ScrollView {
                    VStack(spacing: Spacing.xl) {
                        // Header
                        VStack(spacing: Spacing.sm) {
                            Text("Your Profilescope")
                                .font(.footnote).fontWeight(.semibold)
                                .foregroundColor(Color.appPrimary)
                                .textCase(.uppercase)
                                .tracking(1.5)

                            Text("Here's what we discovered")
                                .font(.displayMedium)
                                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                        }
                        .padding(.top, Spacing.xxl)
                        .opacity(showContent ? 1 : 0)
                        .offset(y: showContent ? 0 : 20)

                        // Archetype Card
                        archetypeCard
                            .opacity(showContent ? 1 : 0)
                            .offset(y: showContent ? 0 : 30)

                        // "You write like" card
                        writesLikeCard
                            .opacity(showContent ? 1 : 0)
                            .offset(y: showContent ? 0 : 40)

                        // Voice traits
                        if let voice = voiceSignature {
                            traitsCard(voice: voice)
                                .opacity(showContent ? 1 : 0)
                                .offset(y: showContent ? 0 : 50)
                        }

                        // Superpower
                        superpowerCard
                            .opacity(showContent ? 1 : 0)
                            .offset(y: showContent ? 0 : 60)

                        Spacer()
                            .frame(height: 100)
                    }
                    .padding(.horizontal, Spacing.lg)
                }

                // Continue button
                VStack {
                    Spacer()

                    VStack(spacing: 0) {
                        LinearGradient(
                            colors: [Color.adaptiveBackground(colorScheme).opacity(0), Color.adaptiveBackground(colorScheme)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        .frame(height: 40)

                        Button(action: onComplete) {
                            HStack {
                                Text("Let's Create Content")
                                    .font(.headline)
                                Image(systemName: "arrow.right")
                                    .font(.subheadline).fontWeight(.semibold)
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(
                                LinearGradient(
                                    colors: [Color.appPrimary, Color(hex: "8B5CF6")],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .foregroundColor(.white)
                            .cornerRadius(14)
                        }
                        .padding(.horizontal, Spacing.lg)
                        .padding(.bottom, Spacing.xxl)
                        .background(Color.adaptiveBackground(colorScheme))
                    }
                }
                .opacity(showContent ? 1 : 0)
            }
        }
        .onAppear {
            loadVoiceSignature()
        }
    }

    // MARK: - Archetype Card

    private var archetypeCard: some View {
        VStack(spacing: Spacing.md) {
            Text("You are a")
                .font(.footnote).fontWeight(.medium)
                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))

            Text(archetype.emoji)
                .font(.system(size: 56))

            Text(archetype.name)
                .font(.displayLarge)
                .foregroundStyle(
                    LinearGradient(
                        colors: [Color(hex: archetype.color1), Color(hex: archetype.color2)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )

            Text(archetype.description)
                .font(.subheadline)
                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                .multilineTextAlignment(.center)
                .padding(.horizontal, Spacing.lg)
        }
        .padding(.vertical, Spacing.xl)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: CornerRadius.xlarge)
                .fill(Color.adaptiveSecondaryBackground(colorScheme))
                .overlay(
                    RoundedRectangle(cornerRadius: CornerRadius.xlarge)
                        .stroke(
                            LinearGradient(
                                colors: [Color(hex: archetype.color1).opacity(0.5), Color(hex: archetype.color2).opacity(0.2)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
        )
    }

    // MARK: - Writes Like Card

    private var writesLikeCard: some View {
        VStack(spacing: Spacing.md) {
            HStack {
                Text("You write like")
                    .font(.footnote).fontWeight(.medium)
                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                Spacer()
                Text(writesLike.emoji)
                    .font(.system(size: 24))
            }

            HStack {
                Text(writesLike.name)
                    .font(.title2).fontWeight(.bold)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                Spacer()
            }

            HStack {
                Text(writesLike.description)
                    .font(.footnote)
                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                Spacer()
            }
        }
        .padding(Spacing.lg)
        .background(
            RoundedRectangle(cornerRadius: CornerRadius.large)
                .fill(Color.adaptiveSecondaryBackground(colorScheme))
                .overlay(
                    RoundedRectangle(cornerRadius: CornerRadius.large)
                        .stroke(Color.adaptiveSeparator(colorScheme), lineWidth: 1)
                )
        )
    }

    // MARK: - Traits Card

    @ViewBuilder
    private func traitsCard(voice: VoiceSignatureResponse) -> some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Text("Your Voice DNA")
                .font(.callout).fontWeight(.semibold)
                .foregroundColor(Color.adaptivePrimaryText(colorScheme))

            VStack(spacing: Spacing.md) {
                traitBar(name: "Formal", value: voice.formal, color: "3B82F6", icon: "briefcase.fill")
                traitBar(name: "Bold", value: voice.bold, color: "EF4444", icon: "flame.fill")
                traitBar(name: "Empathetic", value: voice.empathetic, color: "EC4899", icon: "heart.fill")
                traitBar(name: "Complex", value: voice.complexity, color: "8B5CF6", icon: "brain")
                traitBar(name: "Concise", value: voice.brevity, color: "10B981", icon: "bolt.fill")
            }
        }
        .padding(Spacing.lg)
        .background(
            RoundedRectangle(cornerRadius: CornerRadius.large)
                .fill(Color.adaptiveSecondaryBackground(colorScheme))
                .overlay(
                    RoundedRectangle(cornerRadius: CornerRadius.large)
                        .stroke(Color.adaptiveSeparator(colorScheme), lineWidth: 1)
                )
        )
    }

    @ViewBuilder
    private func traitBar(name: String, value: Double, color: String, icon: String) -> some View {
        HStack(spacing: Spacing.md) {
            Image(systemName: icon)
                .font(.footnote)
                .foregroundColor(Color(hex: color))
                .frame(width: 20)

            Text(name)
                .font(.footnote).fontWeight(.medium)
                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                .frame(width: 80, alignment: .leading)

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.adaptiveSeparator(colorScheme))
                        .frame(height: 8)

                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(hex: color))
                        .frame(width: animateTraits ? geometry.size.width * CGFloat(value) / 10.0 : 0, height: 8)
                        .animation(.spring(response: 0.6, dampingFraction: 0.7).delay(0.3), value: animateTraits)
                }
            }
            .frame(height: 8)

            Text("\(Int(value))")
                .font(.caption).fontWeight(.semibold)
                .foregroundColor(Color(hex: color))
                .frame(width: 24)
        }
    }

    // MARK: - Superpower Card

    private var superpowerCard: some View {
        VStack(spacing: Spacing.md) {
            HStack {
                Image(systemName: "star.fill")
                    .foregroundColor(.yellow)
                Text("Your Superpower")
                    .font(.footnote).fontWeight(.semibold)
                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                Spacer()
            }

            Text(archetype.superpower)
                .font(.headline)
                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                .frame(maxWidth: .infinity, alignment: .leading)

            Text(archetype.superpowerDescription)
                .font(.footnote)
                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(Spacing.lg)
        .background(
            RoundedRectangle(cornerRadius: CornerRadius.large)
                .fill(
                    LinearGradient(
                        colors: [Color.yellow.opacity(0.1), Color.orange.opacity(0.05)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: CornerRadius.large)
                        .stroke(Color.yellow.opacity(0.3), lineWidth: 1)
                )
        )
    }

    // MARK: - Data Loading

    private func loadVoiceSignature() {
        Task {
            do {
                // First trigger analysis
                let voice: VoiceSignatureResponse = try await APIClient.shared.post(
                    endpoint: Config.Endpoints.voiceAnalyze,
                    body: [:]
                )

                await MainActor.run {
                    self.voiceSignature = voice
                    self.isLoading = false

                    // Animate content appearance
                    withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                        self.showContent = true
                    }

                    // Animate trait bars
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        self.animateTraits = true
                    }
                }
            } catch {
                print("Failed to load voice signature: \(error)")

                // Show default content on error
                await MainActor.run {
                    self.voiceSignature = VoiceSignatureResponse(
                        formal: 5.0, bold: 5.0, empathetic: 5.0,
                        complexity: 5.0, brevity: 5.0,
                        primaryTone: "Balanced",
                        confidence: 0.5
                    )
                    self.isLoading = false

                    withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                        self.showContent = true
                    }

                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        self.animateTraits = true
                    }
                }
            }
        }
    }
}

// MARK: - Profile Archetypes

enum ProfileArchetype {
    case disruptor
    case storyteller
    case thought_leader
    case straight_shooter
    case connector
    case analyst
    case versatile

    static var `default`: ProfileArchetype { .versatile }

    var name: String {
        switch self {
        case .disruptor: return "Disruptor"
        case .storyteller: return "Storyteller"
        case .thought_leader: return "Thought Leader"
        case .straight_shooter: return "Straight Shooter"
        case .connector: return "Connector"
        case .analyst: return "Analyst"
        case .versatile: return "Versatile Voice"
        }
    }

    var emoji: String {
        switch self {
        case .disruptor: return "⚡"
        case .storyteller: return "📖"
        case .thought_leader: return "🎯"
        case .straight_shooter: return "💎"
        case .connector: return "🤝"
        case .analyst: return "🔬"
        case .versatile: return "✨"
        }
    }

    var description: String {
        switch self {
        case .disruptor:
            return "You challenge the status quo with bold ideas and fearless opinions. Your content sparks conversations and disrupts conventional thinking."
        case .storyteller:
            return "You connect through emotion and narrative. Your posts feel personal, relatable, and leave a lasting impression on readers."
        case .thought_leader:
            return "You bring strategic depth and intellectual rigor. Your content educates, enlightens, and positions you as an authority."
        case .straight_shooter:
            return "You cut through the noise with direct, no-nonsense communication. Your posts are punchy, memorable, and action-oriented."
        case .connector:
            return "You build bridges between people and ideas. Your warm, accessible style makes complex topics feel inviting."
        case .analyst:
            return "You bring data-driven insights and structured thinking. Your content is well-researched, thorough, and credible."
        case .versatile:
            return "You adapt your voice to different contexts while maintaining authenticity. Your range makes you effective across topics."
        }
    }

    var color1: String {
        switch self {
        case .disruptor: return "EF4444"
        case .storyteller: return "EC4899"
        case .thought_leader: return "6366F1"
        case .straight_shooter: return "F59E0B"
        case .connector: return "10B981"
        case .analyst: return "3B82F6"
        case .versatile: return "8B5CF6"
        }
    }

    var color2: String {
        switch self {
        case .disruptor: return "F97316"
        case .storyteller: return "8B5CF6"
        case .thought_leader: return "8B5CF6"
        case .straight_shooter: return "EF4444"
        case .connector: return "06B6D4"
        case .analyst: return "6366F1"
        case .versatile: return "EC4899"
        }
    }

    var superpower: String {
        switch self {
        case .disruptor: return "Sparking Change"
        case .storyteller: return "Creating Connection"
        case .thought_leader: return "Shaping Perspectives"
        case .straight_shooter: return "Cutting Through Noise"
        case .connector: return "Building Community"
        case .analyst: return "Delivering Insights"
        case .versatile: return "Adapting & Engaging"
        }
    }

    var superpowerDescription: String {
        switch self {
        case .disruptor:
            return "Your bold takes get people talking. Use this to challenge industry norms and start important conversations."
        case .storyteller:
            return "You make readers feel something. Use personal experiences to make your expertise memorable and shareable."
        case .thought_leader:
            return "People look to you for the big picture. Share frameworks and strategic insights that help others see clearly."
        case .straight_shooter:
            return "Your clarity is refreshing. Deliver actionable advice that people can immediately implement."
        case .connector:
            return "You make everyone feel welcome. Use your warmth to build engaged communities around your content."
        case .analyst:
            return "Your research is your credibility. Back your insights with data to stand out as a trusted source."
        case .versatile:
            return "Your adaptability is rare. Match your tone to your audience while keeping your authentic core."
        }
    }
}

#Preview {
    ProfileScopeResultView {
        print("Complete")
    }
}
