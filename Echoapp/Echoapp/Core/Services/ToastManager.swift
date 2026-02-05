import SwiftUI

/// Toast types for different notification styles
enum ToastType {
    case success
    case error
    case warning
    case info

    var backgroundColor: Color {
        switch self {
        case .success: return Color.green.opacity(0.9)
        case .error: return Color.red.opacity(0.9)
        case .warning: return Color.orange.opacity(0.9)
        case .info: return Color.blue.opacity(0.9)
        }
    }

    var icon: String {
        switch self {
        case .success: return "checkmark.circle.fill"
        case .error: return "xmark.circle.fill"
        case .warning: return "exclamationmark.triangle.fill"
        case .info: return "info.circle.fill"
        }
    }
}

/// Toast message model
struct ToastMessage: Identifiable, Equatable {
    let id = UUID()
    let message: String
    let type: ToastType
    let duration: Double

    static func == (lhs: ToastMessage, rhs: ToastMessage) -> Bool {
        lhs.id == rhs.id
    }
}

/// Global toast manager singleton
@MainActor
final class ToastManager: ObservableObject {
    static let shared = ToastManager()

    @Published var currentToast: ToastMessage?

    private init() {}

    /// Show a toast message
    func show(_ message: String, type: ToastType = .info, duration: Double = 3.0) {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
            currentToast = ToastMessage(message: message, type: type, duration: duration)
        }

        // Auto-dismiss after duration
        Task {
            try? await Task.sleep(nanoseconds: UInt64(duration * 1_000_000_000))
            await MainActor.run {
                withAnimation(.easeOut(duration: 0.3)) {
                    if self.currentToast?.id == self.currentToast?.id {
                        self.currentToast = nil
                    }
                }
            }
        }
    }

    /// Convenience methods
    func success(_ message: String) {
        show(message, type: .success)
    }

    func error(_ message: String) {
        show(message, type: .error, duration: 4.0)
    }

    func warning(_ message: String) {
        show(message, type: .warning)
    }

    func info(_ message: String) {
        show(message, type: .info)
    }

    /// Dismiss current toast
    func dismiss() {
        withAnimation(.easeOut(duration: 0.3)) {
            currentToast = nil
        }
    }
}

/// Toast view component
struct ToastView: View {
    let toast: ToastMessage
    let onDismiss: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: toast.type.icon)
                .font(.system(size: 20, weight: .semibold))
                .foregroundColor(.white)

            Text(toast.message)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.white)
                .lineLimit(2)

            Spacer()

            Button(action: onDismiss) {
                Image(systemName: "xmark")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.white.opacity(0.7))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(toast.type.backgroundColor)
                .shadow(color: .black.opacity(0.15), radius: 8, x: 0, y: 4)
        )
        .padding(.horizontal, 16)
    }
}

/// Toast overlay modifier for ContentView
struct ToastOverlay: ViewModifier {
    @ObservedObject var toastManager = ToastManager.shared

    func body(content: Content) -> some View {
        ZStack {
            content

            VStack {
                if let toast = toastManager.currentToast {
                    ToastView(toast: toast) {
                        toastManager.dismiss()
                    }
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .zIndex(100)
                }
                Spacer()
            }
            .padding(.top, 50) // Below status bar
        }
    }
}

extension View {
    func withToastOverlay() -> some View {
        modifier(ToastOverlay())
    }
}
