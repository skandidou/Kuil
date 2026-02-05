//
//  LinkedInProfileSyncView.swift
//  Kuil
//
//  Screen to collect LinkedIn profile URL for AI voice analysis
//  Shown after LinkedIn OAuth, before tone calibration
//

import SwiftUI

struct LinkedInProfileSyncView: View {
    @State private var profileURL: String = ""
    @State private var isLoading: Bool = false
    @State private var showError: Bool = false
    @State private var errorMessage: String = ""
    @State private var showHelp: Bool = false
    @State private var syncSuccess: Bool = false
    @State private var postsCount: Int = 0

    var onComplete: () -> Void
    var onSkip: () -> Void

    // Validate LinkedIn URL format and extract username
    private var isValidURL: Bool {
        return extractedUsername != nil
    }

    // Extract username from various input formats
    private var extractedUsername: String? {
        var trimmed = profileURL.trimmingCharacters(in: .whitespacesAndNewlines)

        // If empty, return nil
        guard !trimmed.isEmpty else { return nil }

        // Pattern 0: Handle @ prefix - e.g., "@skander-mabrouk" -> "skander-mabrouk"
        if trimmed.hasPrefix("@") {
            trimmed = String(trimmed.dropFirst())
        }

        // Pattern 1: Full URL - https://linkedin.com/in/username or https://www.linkedin.com/in/username
        if let match = trimmed.range(of: #"linkedin\.com/in/([a-zA-Z0-9\-_]+)"#, options: .regularExpression) {
            let fullMatch = String(trimmed[match])
            // Extract just the username part
            if let usernameMatch = fullMatch.range(of: #"/in/([a-zA-Z0-9\-_]+)"#, options: .regularExpression) {
                let withPrefix = String(fullMatch[usernameMatch])
                return String(withPrefix.dropFirst(4)) // Remove "/in/"
            }
        }

        // Pattern 2: Just the username (no URL) - e.g., "johndoe" or "john-doe"
        // Must not contain URL-like characters: / . ? & =
        let usernamePattern = #"^[a-zA-Z0-9\-_]{3,100}$"#
        if trimmed.range(of: usernamePattern, options: .regularExpression) != nil &&
           !trimmed.contains("/") && !trimmed.contains(".") && !trimmed.contains("?") &&
           !trimmed.contains("&") && !trimmed.contains("=") {
            return trimmed
        }

        // Pattern 3: Partial URL that might be truncated (invalid)
        // If it contains query params but no valid linkedin.com/in/ path, it's truncated
        if trimmed.contains("utm_") || trimmed.contains("?") || trimmed.contains("&") || trimmed.contains("=") {
            if !trimmed.contains("linkedin.com/in/") {
                return nil // Truncated URL - reject it
            }
        }

        return nil
    }

    // Build clean LinkedIn URL from username
    private var cleanLinkedInURL: String? {
        guard let username = extractedUsername else { return nil }
        return "https://www.linkedin.com/in/\(username)"
    }

    // Error message for invalid URL
    private var urlValidationError: String? {
        let trimmed = profileURL.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }

        // Detect truncated URL
        if (trimmed.contains("utm_") || trimmed.contains("?") || trimmed.contains("&")) &&
           !trimmed.contains("linkedin.com/in/") {
            return "URL appears truncated. Please copy the full LinkedIn profile URL."
        }

        // Detect invalid format
        if extractedUsername == nil {
            return "Enter your LinkedIn username (@yourname) or full profile URL."
        }

        return nil
    }

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [
                    Color(hex: "0A0A0F"),
                    Color(hex: "1A1A2E")
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 28) {
                    Spacer()
                        .frame(height: 40)

                    // Icon
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [
                                        Color(hex: "0077B5").opacity(0.3),
                                        Color(hex: "00A0DC").opacity(0.1)
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 100, height: 100)

                        Image(systemName: "person.text.rectangle")
                            .font(.system(size: 40, weight: .medium))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [Color(hex: "0077B5"), Color(hex: "00A0DC")],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                    }

                    // Title & Description
                    VStack(spacing: 12) {
                        Text("Analyze Your Writing Style")
                            .font(.system(size: 26, weight: .bold))
                            .foregroundColor(.white)
                            .multilineTextAlignment(.center)

                        Text("Share your LinkedIn profile so our AI can learn from your existing posts and match your unique voice.")
                            .font(.system(size: 15))
                            .foregroundColor(.white.opacity(0.7))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 20)
                    }

                    // URL Input
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Your LinkedIn Profile")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))

                        HStack {
                            Image(systemName: "at")
                                .foregroundColor(.white.opacity(0.5))
                                .frame(width: 20)

                            TextField("", text: $profileURL)
                                .placeholder(when: profileURL.isEmpty) {
                                    Text("@yourname or linkedin.com/in/yourname")
                                        .foregroundColor(.white.opacity(0.3))
                                }
                                .foregroundColor(.white)
                                .autocapitalization(.none)
                                .autocorrectionDisabled()
                                .keyboardType(.URL)
                        }
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.white.opacity(0.08))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(
                                            urlValidationError != nil ? Color.orange.opacity(0.5) :
                                            isValidURL ? Color(hex: "0077B5").opacity(0.5) : Color.white.opacity(0.1),
                                            lineWidth: 1
                                        )
                                )
                        )

                        // Real-time validation error
                        if let validationError = urlValidationError {
                            HStack(spacing: 6) {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .font(.system(size: 12))
                                Text(validationError)
                                    .font(.system(size: 12))
                            }
                            .foregroundColor(.orange)
                            .padding(.top, 4)
                        } else if isValidURL, let username = extractedUsername {
                            HStack(spacing: 6) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 12))
                                Text("Profile found: \(username)")
                                    .font(.system(size: 12))
                            }
                            .foregroundColor(.green)
                            .padding(.top, 4)
                        }

                        // Help dropdown
                        DisclosureGroup(
                            isExpanded: $showHelp,
                            content: {
                                VStack(alignment: .leading, spacing: 16) {
                                    helpStep(number: "1", text: "Open the LinkedIn app or website")
                                    helpStep(number: "2", text: "Go to your profile page")
                                    helpStep(number: "3", text: "Tap the 3 dots (...) menu")
                                    helpStep(number: "4", text: "Select \"Share via...\" or \"Copy link\"")
                                    helpStep(number: "5", text: "Paste the link here")

                                    // Example
                                    Text("Example: https://linkedin.com/in/johndoe")
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundColor(Color(hex: "0077B5"))
                                        .padding(.top, 4)
                                }
                                .padding(.top, 12)
                            },
                            label: {
                                HStack {
                                    Image(systemName: "questionmark.circle")
                                        .foregroundColor(Color(hex: "0077B5"))
                                    Text("How to find your profile URL?")
                                        .font(.system(size: 14, weight: .medium))
                                        .foregroundColor(Color(hex: "0077B5"))
                                }
                            }
                        )
                        .accentColor(Color(hex: "0077B5"))
                        .padding(.top, 8)
                    }
                    .padding(.horizontal, 20)

                    // Benefits
                    VStack(alignment: .leading, spacing: 14) {
                        benefitRow(
                            icon: "wand.and.stars",
                            text: "AI learns your unique writing style"
                        )
                        benefitRow(
                            icon: "text.quote",
                            text: "Generated posts match your voice"
                        )
                        benefitRow(
                            icon: "lock.shield",
                            text: "Your data stays private & secure"
                        )
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 20)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.white.opacity(0.05))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(Color.white.opacity(0.1), lineWidth: 1)
                            )
                    )
                    .padding(.horizontal, 20)

                    // Success message
                    if syncSuccess {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                            Text("\(postsCount) posts analyzed successfully!")
                                .font(.system(size: 15, weight: .medium))
                                .foregroundColor(.green)
                        }
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.green.opacity(0.15))
                        )
                        .padding(.horizontal, 20)
                    }

                    // Error message
                    if showError {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.orange)
                            Text(errorMessage)
                                .font(.system(size: 14))
                                .foregroundColor(.orange)
                        }
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.orange.opacity(0.15))
                        )
                        .padding(.horizontal, 20)
                    }

                    Spacer()
                        .frame(height: 20)

                    // Buttons
                    VStack(spacing: 12) {
                        // Analyze button
                        Button(action: syncPosts) {
                            HStack {
                                if isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                        .scaleEffect(0.8)
                                    Text("Analyzing posts...")
                                        .font(.system(size: 17, weight: .semibold))
                                } else if syncSuccess {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 17, weight: .semibold))
                                    Text("Continue")
                                        .font(.system(size: 17, weight: .semibold))
                                } else {
                                    Image(systemName: "sparkles")
                                        .font(.system(size: 17, weight: .semibold))
                                    Text("Analyze My Posts")
                                        .font(.system(size: 17, weight: .semibold))
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(
                                LinearGradient(
                                    colors: isValidURL || syncSuccess
                                        ? [Color(hex: "0077B5"), Color(hex: "00A0DC")]
                                        : [Color.gray.opacity(0.3), Color.gray.opacity(0.2)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .foregroundColor(.white)
                            .cornerRadius(14)
                        }
                        .disabled((!isValidURL && !syncSuccess) || isLoading)

                        // Skip button
                        Button(action: onSkip) {
                            Text("Skip for now")
                                .font(.system(size: 15, weight: .medium))
                                .foregroundColor(.white.opacity(0.5))
                        }
                        .disabled(isLoading)
                        .padding(.top, 4)

                        Text("You can always add this later in settings")
                            .font(.system(size: 12))
                            .foregroundColor(.white.opacity(0.3))
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 40)
                }
            }
        }
    }

    @ViewBuilder
    private func benefitRow(icon: String, text: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(Color(hex: "0077B5"))
                .frame(width: 24)

            Text(text)
                .font(.system(size: 15))
                .foregroundColor(.white.opacity(0.8))

            Spacer()
        }
    }

    @ViewBuilder
    private func helpStep(number: String, text: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text(number)
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.white)
                .frame(width: 22, height: 22)
                .background(Circle().fill(Color(hex: "0077B5").opacity(0.3)))

            Text(text)
                .font(.system(size: 14))
                .foregroundColor(.white.opacity(0.7))
        }
    }

    private func syncPosts() {
        // If already synced, just continue
        if syncSuccess {
            onComplete()
            return
        }

        // Show validation error if URL is invalid
        if let validationError = urlValidationError {
            showError = true
            errorMessage = validationError
            return
        }

        guard let cleanURL = cleanLinkedInURL else {
            showError = true
            errorMessage = "Please enter a valid LinkedIn profile URL or username."
            return
        }

        isLoading = true
        showError = false

        print("📤 Syncing LinkedIn posts with URL: \(cleanURL)")

        Task {
            do {
                // Call the sync-posts API with cleaned URL
                let response: SyncPostsResponse = try await APIClient.shared.post(
                    endpoint: "/api/linkedin/sync-posts",
                    body: ["profileUrl": cleanURL]
                )

                await MainActor.run {
                    isLoading = false

                    if response.success {
                        syncSuccess = true
                        postsCount = response.postsCount

                        // Auto-continue after 1.5 seconds
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                            onComplete()
                        }
                    } else {
                        showError = true
                        errorMessage = response.message ?? "Failed to analyze posts"
                    }
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                    showError = true
                    errorMessage = "Could not connect. You can skip and try later."
                }
            }
        }
    }
}

// Response model
struct SyncPostsResponse: Codable {
    let success: Bool
    let postsCount: Int
    let message: String?
}

// Placeholder extension for TextField
extension View {
    func placeholder<Content: View>(
        when shouldShow: Bool,
        alignment: Alignment = .leading,
        @ViewBuilder placeholder: () -> Content
    ) -> some View {
        ZStack(alignment: alignment) {
            placeholder().opacity(shouldShow ? 1 : 0)
            self
        }
    }
}

#Preview {
    LinkedInProfileSyncView(
        onComplete: { print("Complete") },
        onSkip: { print("Skip") }
    )
}
