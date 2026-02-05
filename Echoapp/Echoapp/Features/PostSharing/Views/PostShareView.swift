//
//  PostShareView.swift
//  Kuil
//
//  Viral sharing feature - Makes generated posts shareable to social media
//  Implements insights from B2C app growth strategies:
//  - Easy screenshot sharing for Instagram/Twitter
//  - Attribution watermark for organic growth
//  - Beautiful card design for high shareability
//

import SwiftUI

struct PostShareView: View {
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.dismiss) var dismiss

    let post: ShareablePost
    @State private var isSharing = false
    @State private var shareImage: UIImage?

    var body: some View {
        ZStack {
            Color.adaptiveBackground(colorScheme)
                .ignoresSafeArea()

            VStack(spacing: Spacing.xl) {
                // Header
                HStack {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title2)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                    }

                    Spacer()

                    Text("Share Post")
                        .font(.headline)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                    Spacer()

                    // Hidden spacer for centering
                    Color.clear.frame(width: 30, height: 30)
                }
                .padding(.horizontal, Spacing.lg)

                // Shareable card preview
                shareableCardView
                    .padding(.horizontal, Spacing.lg)

                // Share options
                VStack(spacing: Spacing.md) {
                    Text("Choose how to share")
                        .font(.subheadline)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))

                    HStack(spacing: Spacing.md) {
                        shareButton(
                            icon: "square.and.arrow.up",
                            title: "Share",
                            color: Color.accentBlue
                        ) {
                            sharePost()
                        }

                        shareButton(
                            icon: "photo",
                            title: "Save Image",
                            color: Color.accentCyan
                        ) {
                            saveAsImage()
                        }

                        shareButton(
                            icon: "doc.on.doc",
                            title: "Copy Text",
                            color: Color.accentTeal
                        ) {
                            copyText()
                        }
                    }
                }

                Spacer()
            }
            .padding(.top, Spacing.xl)
        }
    }

    // MARK: - Shareable Card

    @ViewBuilder
    private var shareableCardView: some View {
        VStack(alignment: .leading, spacing: Spacing.lg) {
            // Hook Score Badge
            HStack {
                HStack(spacing: Spacing.xs) {
                    Image(systemName: "sparkles")
                        .font(.caption)
                    Text("Hook Score: \(post.hookScore)")
                        .font(.caption)
                        .fontWeight(.semibold)
                }
                .padding(.horizontal, Spacing.sm)
                .padding(.vertical, Spacing.xs)
                .background(Color.accentBlue.opacity(0.2))
                .foregroundColor(Color.accentBlue)
                .cornerRadius(CornerRadius.small)

                Spacer()
            }

            // Post content
            Text(post.content)
                .font(.body)
                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                .lineSpacing(6)
                .fixedSize(horizontal: false, vertical: true)

            // Hashtags
            if let hashtags = post.hashtags {
                Text(hashtags)
                    .font(.footnote)
                    .foregroundColor(Color.accentBlue)
            }

            Divider()
                .background(Color.adaptiveSecondaryText(colorScheme).opacity(0.3))

            // Attribution footer (key for viral growth!)
            HStack {
                Image(systemName: "waveform")
                    .font(.caption)
                    .foregroundColor(Color.accentBlue)

                Text("Generated with Kuil")
                    .font(.caption)
                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))

                Spacer()

                Text("Get the app")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(Color.accentBlue)
            }
        }
        .padding(Spacing.lg)
        .background(Color.adaptiveSecondaryBackground(colorScheme))
        .cornerRadius(CornerRadius.large)
        .shadow(color: Color.black.opacity(0.1), radius: 12, x: 0, y: 4)
    }

    // MARK: - Share Button Component

    @ViewBuilder
    private func shareButton(
        icon: String,
        title: String,
        color: Color,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            VStack(spacing: Spacing.xs) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                    .frame(width: 50, height: 50)
                    .background(color.opacity(0.1))
                    .cornerRadius(CornerRadius.medium)

                Text(title)
                    .font(.caption)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
            }
        }
    }

    // MARK: - Actions

    private func sharePost() {
        // Convert card to image first
        guard let image = shareableCardView.asImage() else {
            return
        }

        let activityVC = UIActivityViewController(
            activityItems: [image, post.content],
            applicationActivities: nil
        )

        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let rootVC = windowScene.windows.first?.rootViewController {
            rootVC.present(activityVC, animated: true)
        }
    }

    private func saveAsImage() {
        guard let image = shareableCardView.asImage() else {
            return
        }

        UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)

        // Show success feedback
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)
    }

    private func copyText() {
        var fullText = post.content
        if let hashtags = post.hashtags {
            fullText += "\n\n\(hashtags)"
        }
        fullText += "\n\n✨ Generated with Kuil"

        UIPasteboard.general.string = fullText

        // Show success feedback
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)
    }
}

// MARK: - Supporting Types

struct ShareablePost {
    let content: String
    let hookScore: Int
    let hashtags: String?
}

// MARK: - View to Image Extension

extension View {
    func asImage() -> UIImage? {
        let controller = UIHostingController(rootView: self)
        let view = controller.view

        let targetSize = CGSize(width: 375, height: 600)
        view?.bounds = CGRect(origin: .zero, size: targetSize)
        view?.backgroundColor = .clear

        let renderer = UIGraphicsImageRenderer(size: targetSize)
        return renderer.image { _ in
            view?.drawHierarchy(in: controller.view.bounds, afterScreenUpdates: true)
        }
    }
}

// MARK: - Preview

#Preview {
    PostShareView(post: ShareablePost(
        content: "Most founders wait too long to ship.\n\nPerfect is the enemy of revenue. I spent 6 months building my first MVP in silence. It failed in 6 days.\n\nNow, I ship when I'm still slightly embarrassed by the UI. That's where the growth happens.\n\nAgree or disagree?",
        hookScore: 94,
        hashtags: "#Founders #GrowthMindset #MVP"
    ))
}
