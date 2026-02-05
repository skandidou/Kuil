//
//  UserRoleSelectionView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

struct UserRole: Identifiable {
    let id = UUID()
    let title: String
    let icon: String
    let description: String
    let gradient: [Color]
}

struct UserRoleSelectionView: View {
    @Environment(\.dismiss) var dismiss
    @State private var selectedRole: UserRole?
    @State private var showConfirmation = false

    let roles: [UserRole] = [
        UserRole(
            title: "Founder",
            icon: "lightbulb.fill",
            description: "Building and growing your startup",
            gradient: [Color.appPrimary, Color.accentCyan]
        ),
        UserRole(
            title: "Job Seeker",
            icon: "briefcase.fill",
            description: "Looking for new opportunities",
            gradient: [Color.purple, Color.pink]
        ),
        UserRole(
            title: "Creator",
            icon: "sparkles",
            description: "Sharing insights and content",
            gradient: [Color.orange, Color.yellow]
        ),
        UserRole(
            title: "Freelancer",
            icon: "person.fill",
            description: "Growing your client base",
            gradient: [Color.green, Color.mint]
        ),
        UserRole(
            title: "Executive",
            icon: "star.fill",
            description: "Leading teams and companies",
            gradient: [Color.indigo, Color.blue]
        ),
        UserRole(
            title: "Other",
            icon: "ellipsis.circle.fill",
            description: "Define your own path",
            gradient: [Color.gray, Color.secondary]
        )
    ]

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                VStack(spacing: Spacing.md) {
                    Text("How do you define yourself?")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.primaryText)
                        .multilineTextAlignment(.center)

                    Text("This helps us personalize your content")
                        .font(.callout)
                        .foregroundColor(.secondaryText)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, Spacing.xl)
                .padding(.horizontal, Spacing.lg)

                // Roles grid
                ScrollView {
                    LazyVGrid(
                        columns: [
                            GridItem(.flexible(), spacing: Spacing.md),
                            GridItem(.flexible(), spacing: Spacing.md)
                        ],
                        spacing: Spacing.md
                    ) {
                        ForEach(roles) { role in
                            roleCard(role)
                        }
                    }
                    .padding(.horizontal, Spacing.lg)
                    .padding(.top, Spacing.xl)
                    .padding(.bottom, 120)
                }

                // Bottom gradient overlay for better visibility
                LinearGradient(
                    colors: [Color.appBackground.opacity(0), Color.appBackground],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: 100)
                .allowsHitTesting(false)
            }

            // Floating continue button
            VStack {
                Spacer()

                if selectedRole != nil {
                    Button(action: saveAndContinue) {
                        HStack(spacing: Spacing.sm) {
                            Text("Continue as \(selectedRole?.title ?? "")")
                                .font(.headline)
                                .fontWeight(.semibold)

                            Image(systemName: "arrow.right")
                                .font(.headline)
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(
                            LinearGradient(
                                colors: selectedRole?.gradient ?? [Color.appPrimary, Color.accentCyan],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .cornerRadius(CornerRadius.medium)
                        .shadow(color: (selectedRole?.gradient.first ?? Color.appPrimary).opacity(0.4), radius: 20, x: 0, y: 10)
                    }
                    .padding(.horizontal, Spacing.lg)
                    .padding(.bottom, Spacing.xl)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
        }
    }

    private func roleCard(_ role: UserRole) -> some View {
        Button(action: {
            withAnimation(.appBouncy) {
                selectedRole = role
            }
        }) {
            VStack(spacing: Spacing.md) {
                // Icon with gradient background
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: role.gradient,
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 60, height: 60)

                    Image(systemName: role.icon)
                        .font(.title2)
                        .foregroundColor(.white)
                }

                // Title
                Text(role.title)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(.primaryText)

                // Description
                Text(role.description)
                    .font(.caption)
                    .foregroundColor(.secondaryText)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.vertical, Spacing.lg)
            .padding(.horizontal, Spacing.md)
            .frame(maxWidth: .infinity)
            .frame(height: 180)
            .background(
                ZStack {
                    Color.appSecondaryBackground

                    if selectedRole?.id == role.id {
                        RoundedRectangle(cornerRadius: CornerRadius.medium)
                            .stroke(
                                LinearGradient(
                                    colors: role.gradient,
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 2
                            )
                    }
                }
            )
            .cornerRadius(CornerRadius.medium)
            .scaleEffect(selectedRole?.id == role.id ? 1.02 : 1.0)
            .shadow(
                color: selectedRole?.id == role.id ? (role.gradient.first ?? Color.appPrimary).opacity(0.3) : Color.clear,
                radius: selectedRole?.id == role.id ? 20 : 0,
                x: 0,
                y: selectedRole?.id == role.id ? 10 : 0
            )
        }
        .buttonStyle(PlainButtonStyle())
    }

    private func saveAndContinue() {
        guard let role = selectedRole else { return }

        // Save user role to backend
        Task {
            do {
                print("💾 Saving user role: \(role.title)")

                struct UpdateRoleRequest: Codable {
                    let role: String
                }

                let _: EmptyResponse = try await APIClient.shared.post(
                    endpoint: "/api/user/update-role",
                    body: ["role": role.title],
                    requiresAuth: true
                )

                print("✅ User role saved successfully")

                // Update app state immediately (don't wait for next profile fetch)
                await MainActor.run {
                    // Update the role in userProfile immediately so Dashboard shows correct role
                    if var profile = AppState.shared.userProfile {
                        profile.role = role.title  // Update with the newly selected role
                        AppState.shared.userProfile = profile  // Reassign to trigger observation
                        print("✅ Updated AppState.userProfile.role to: \(role.title)")
                    }

                    // Dismiss and complete onboarding
                    NotificationCenter.default.post(name: .toneCalibrationCompleted, object: nil)
                    dismiss()
                }
            } catch {
                print("❌ Failed to save user role: \(error)")
                // Continue anyway - not critical
                await MainActor.run {
                    NotificationCenter.default.post(name: .toneCalibrationCompleted, object: nil)
                    dismiss()
                }
            }
        }
    }
}

/// Generic API response for simple success responses
struct EmptyResponse: Codable {
    let success: Bool?
    let persona: String?
    let role: String?

    init() {
        self.success = nil
        self.persona = nil
        self.role = nil
    }
}

#Preview {
    UserRoleSelectionView()
}
