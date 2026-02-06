//
//  SmartAIEditorView.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//  Completely redesigned for mobile with mode-specific UIs
//

import SwiftUI
import PhotosUI
import PDFKit
import Vision
import UniformTypeIdentifiers

struct SmartAIEditorView: View {
    @ObservedObject var viewModel: SmartAIEditorHookScorerViewModel
    @Environment(\.dismiss) var dismiss
    @Environment(\.colorScheme) var colorScheme
    @FocusState private var isInputFocused: Bool
    @State private var inputText: String = ""
    @State private var showSuccessAnimation = false

    // CV Upload states
    @State private var showDocumentPicker = false
    @State private var showPhotoPicker = false
    @State private var showCamera = false
    @State private var cvFileName: String?
    @State private var cvExtractedText: String?
    @State private var isExtractingText = false
    @State private var selectedPhotoItem: PhotosPickerItem?

    var body: some View {
        ZStack {
            Color.adaptiveBackground(colorScheme).ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                header

                // Content based on source type
                ScrollView {
                    VStack(spacing: Spacing.xl) {
                        // Input section (mode-specific)
                        inputSection
                            .padding(.horizontal, Spacing.lg)
                            .padding(.top, Spacing.lg)

                        // Generated content section
                        if !viewModel.content.isEmpty {
                            generatedContentSection
                                .padding(.horizontal, Spacing.lg)

                            // Hook score
                            hookScoreSection
                                .padding(.horizontal, Spacing.lg)

                            // AI suggestion
                            if let suggestion = viewModel.aiSuggestion {
                                aiSuggestionCard(suggestion)
                                    .padding(.horizontal, Spacing.lg)
                            }

                            // Action buttons
                            actionButtons
                                .padding(.horizontal, Spacing.lg)
                                .padding(.bottom, Spacing.xl)
                        }
                    }
                }
            }

            // Loading overlay
            if viewModel.isGenerating {
                loadingOverlay
            }

            // Success animation
            if showSuccessAnimation {
                successAnimation
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .editorPost)) { _ in
            withAnimation {
                showSuccessAnimation = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                dismiss()
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .editorScheduled)) { _ in
            withAnimation {
                showSuccessAnimation = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                dismiss()
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .editorBack)) { _ in
            dismiss()
        }
        .alert("Error", isPresented: $viewModel.showError) {
            Button("OK", role: .cancel) {
                viewModel.showError = false
            }
        } message: {
            Text(viewModel.errorMessage ?? "An error occurred")
        }
        .sheet(isPresented: $viewModel.showSchedulePicker) {
            schedulePickerSheet
        }
    }

    // MARK: - Schedule Picker Sheet
    private var schedulePickerSheet: some View {
        NavigationView {
            VStack(spacing: Spacing.xl) {
                VStack(alignment: .leading, spacing: Spacing.md) {
                    Text("When should this post go live?")
                        .font(.headline)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                    Text("Choose a date and time to schedule your post")
                        .font(.callout)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, Spacing.lg)
                .padding(.top, Spacing.lg)

                DatePicker(
                    "Schedule Date",
                    selection: $viewModel.scheduledDate,
                    in: Date()...,
                    displayedComponents: [.date, .hourAndMinute]
                )
                .datePickerStyle(.graphical)
                .padding(.horizontal, Spacing.lg)

                Spacer()

                VStack(spacing: Spacing.md) {
                    Button(action: {
                        viewModel.confirmSchedule()
                    }) {
                        HStack(spacing: Spacing.sm) {
                            Image(systemName: "calendar.badge.clock")
                            Text("Schedule Post")
                                .fontWeight(.semibold)
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(
                            LinearGradient(
                                colors: [Color.appPrimary, Color.accentCyan],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .cornerRadius(CornerRadius.medium)
                    }
                    .disabled(viewModel.isSaving)

                    Button(action: {
                        viewModel.showSchedulePicker = false
                    }) {
                        Text("Cancel")
                            .font(.callout)
                            .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                    }
                }
                .padding(.horizontal, Spacing.lg)
                .padding(.bottom, Spacing.xl)
            }
            .background(Color.adaptiveBackground(colorScheme))
            .navigationTitle("Schedule Post")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        viewModel.showSchedulePicker = false
                    }
                    .foregroundColor(.appPrimary)
                }
            }
        }
    }

    // MARK: - Header
    private var header: some View {
        HStack {
            Button(action: { viewModel.back() }) {
                HStack(spacing: Spacing.xs) {
                    Image(systemName: "chevron.left")
                        .font(.headline)
                    Text("Back")
                        .font(.headline)
                }
                .foregroundColor(.appPrimary)
            }

            Spacer()

            VStack(spacing: 2) {
                Text(viewModel.sourceType)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                Text("AI-Powered Editor")
                    .font(.caption)
                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
            }

            Spacer()

            // Placeholder for symmetry
            Text("Back")
                .font(.headline)
                .foregroundColor(.clear)
        }
        .padding(.horizontal, Spacing.lg)
        .padding(.vertical, Spacing.md)
        .background(Color.adaptiveSecondaryBackground(colorScheme).opacity(0.5))
    }

    // MARK: - Input Section (Mode-Specific)
    private var inputSection: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            // Title with icon
            HStack(spacing: Spacing.sm) {
                Image(systemName: iconForMode)
                    .font(.title3)
                    .foregroundColor(.accentCyan)

                Text(titleForMode)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))
            }

            // Input field (type depends on mode)
            if viewModel.sourceType == "From Link" || viewModel.sourceType == "From links" {
                linkInputField
            } else if viewModel.sourceType == "From CV" {
                cvUploadSection
            } else {
                // From Ideas
                ideaInputField
            }

            // Generate button (show when text entered or CV extracted)
            if !inputText.isEmpty && !(viewModel.sourceType == "From CV" && cvExtractedText == nil) {
                generateButton
            }
        }
        .padding(Spacing.lg)
        .background(Color.adaptiveSecondaryBackground(colorScheme))
        .cornerRadius(CornerRadius.large)
    }

    private var iconForMode: String {
        switch viewModel.sourceType {
        case "From Link", "From links":
            return "link"
        case "From CV":
            return "doc.text.fill"
        default:
            return "lightbulb.fill"
        }
    }

    private var titleForMode: String {
        switch viewModel.sourceType {
        case "From Link", "From links":
            return "Paste a link"
        case "From CV":
            return "Upload your CV"
        default:
            return "What's on your mind?"
        }
    }

    private var ideaInputField: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            TextEditor(text: $inputText)
                .frame(minHeight: 120)
                .padding(Spacing.md)
                .background(Color.adaptiveBackground(colorScheme))
                .cornerRadius(CornerRadius.medium)
                .focused($isInputFocused)
                .overlay(
                    RoundedRectangle(cornerRadius: CornerRadius.medium)
                        .stroke(isInputFocused ? Color.accentCyan : Color.clear, lineWidth: 2)
                )

            Text("Share your thoughts, insights, or ideas")
                .font(.caption)
                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
        }
    }

    private var linkInputField: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            HStack {
                Image(systemName: "link")
                    .foregroundColor(Color.adaptiveSecondaryText(colorScheme))

                TextField("https://example.com/article", text: $inputText)
                    .focused($isInputFocused)
                    .keyboardType(.URL)
                    .autocapitalization(.none)
            }
            .padding(Spacing.md)
            .background(Color.adaptiveBackground(colorScheme))
            .cornerRadius(CornerRadius.medium)
            .overlay(
                RoundedRectangle(cornerRadius: CornerRadius.medium)
                    .stroke(isInputFocused ? Color.accentCyan : Color.clear, lineWidth: 2)
            )

            Text("AI will analyze the content and create an engaging post")
                .font(.caption)
                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
        }
    }

    private var cvUploadSection: some View {
        VStack(spacing: Spacing.md) {
            if isExtractingText {
                // Extracting text indicator
                VStack(spacing: Spacing.md) {
                    ProgressView()
                        .scaleEffect(1.5)
                        .tint(.accentCyan)
                    Text("Extracting text from your CV...")
                        .font(.callout)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.xl)
                .background(Color.adaptiveBackground(colorScheme))
                .cornerRadius(CornerRadius.medium)
                .overlay(
                    RoundedRectangle(cornerRadius: CornerRadius.medium)
                        .stroke(style: StrokeStyle(lineWidth: 2, dash: [8, 4]))
                        .foregroundColor(.accentCyan.opacity(0.5))
                )

            } else if let fileName = cvFileName, cvExtractedText != nil {
                // CV uploaded successfully
                VStack(spacing: Spacing.md) {
                    Image(systemName: "doc.text.fill")
                        .font(.system(size: 40))
                        .foregroundColor(.successGreen)

                    Text("CV Uploaded ✓")
                        .font(.callout)
                        .fontWeight(.medium)
                        .foregroundColor(.successGreen)

                    Text(fileName)
                        .font(.caption)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                        .lineLimit(1)

                    // Change file button
                    Button(action: { resetCVUpload() }) {
                        Text("Change file")
                            .font(.caption)
                            .foregroundColor(.accentCyan)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.xl)
                .background(Color.adaptiveBackground(colorScheme))
                .cornerRadius(CornerRadius.medium)
                .overlay(
                    RoundedRectangle(cornerRadius: CornerRadius.medium)
                        .stroke(style: StrokeStyle(lineWidth: 2, dash: [8, 4]))
                        .foregroundColor(.successGreen)
                )

            } else {
                // Upload options
                VStack(spacing: Spacing.md) {
                    Image(systemName: "doc.badge.arrow.up")
                        .font(.system(size: 40))
                        .foregroundColor(.accentCyan)

                    Text("Upload your CV")
                        .font(.callout)
                        .fontWeight(.medium)
                        .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                    Text("PDF, image, or take a photo")
                        .font(.caption)
                        .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.lg)
                .background(Color.adaptiveBackground(colorScheme))
                .cornerRadius(CornerRadius.medium)
                .overlay(
                    RoundedRectangle(cornerRadius: CornerRadius.medium)
                        .stroke(style: StrokeStyle(lineWidth: 2, dash: [8, 4]))
                        .foregroundColor(.accentCyan.opacity(0.5))
                )

                // Three upload option buttons
                HStack(spacing: Spacing.sm) {
                    // Browse files (PDF/DOC)
                    Button(action: { showDocumentPicker = true }) {
                        VStack(spacing: 6) {
                            Image(systemName: "folder.fill")
                                .font(.title3)
                            Text("Files")
                                .font(.caption2)
                        }
                        .foregroundColor(.accentCyan)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.md)
                        .background(Color.accentCyan.opacity(0.1))
                        .cornerRadius(CornerRadius.medium)
                    }

                    // Photo library
                    PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                        VStack(spacing: 6) {
                            Image(systemName: "photo.fill")
                                .font(.title3)
                            Text("Gallery")
                                .font(.caption2)
                        }
                        .foregroundColor(.appPrimary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.md)
                        .background(Color.appPrimary.opacity(0.1))
                        .cornerRadius(CornerRadius.medium)
                    }

                    // Camera
                    Button(action: { showCamera = true }) {
                        VStack(spacing: 6) {
                            Image(systemName: "camera.fill")
                                .font(.title3)
                            Text("Camera")
                                .font(.caption2)
                        }
                        .foregroundColor(.warningYellow)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.md)
                        .background(Color.warningYellow.opacity(0.1))
                        .cornerRadius(CornerRadius.medium)
                    }
                }
            }

            Text("AI will transform your CV into a compelling LinkedIn post")
                .font(.caption)
                .foregroundColor(Color.adaptiveTertiaryText(colorScheme))
                .multilineTextAlignment(.center)
        }
        .sheet(isPresented: $showDocumentPicker) {
            DocumentPickerView { url in
                handlePickedDocument(url: url)
            }
        }
        .sheet(isPresented: $showCamera) {
            CameraPickerView { image in
                handleCapturedImage(image)
            }
        }
        .onChange(of: selectedPhotoItem) { _, newItem in
            guard let newItem else { return }
            guard !isExtractingText else { return } // Prevent re-entrancy
            Task { @MainActor in
                if let data = try? await newItem.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    handleCapturedImage(image)
                }
                selectedPhotoItem = nil // Reset to allow re-selection
            }
        }
    }

    // MARK: - CV Helper Methods

    private func resetCVUpload() {
        cvFileName = nil
        cvExtractedText = nil
        inputText = ""
    }

    private func handlePickedDocument(url: URL) {
        isExtractingText = true
        cvFileName = url.lastPathComponent

        Task {
            let text = await extractTextFromDocument(url: url)
            await MainActor.run {
                if let text, !text.isEmpty {
                    cvExtractedText = text
                    inputText = text
                    debugLog("✅ CV text extracted: \(text.prefix(200))...")
                } else {
                    cvFileName = nil
                    cvExtractedText = nil
                    debugLog("❌ Could not extract text from CV")
                }
                isExtractingText = false
            }
        }
    }

    private func handleCapturedImage(_ image: UIImage) {
        isExtractingText = true
        cvFileName = "Photo CV"

        Task {
            let text = await extractTextFromImage(image)
            // Ensure state updates happen on main thread
            await MainActor.run {
                if let text, !text.isEmpty {
                    cvExtractedText = text
                    inputText = text
                    debugLog("✅ CV text extracted from image: \(text.prefix(200))...")
                } else {
                    cvFileName = nil
                    cvExtractedText = nil
                    debugLog("❌ Could not extract text from image")
                }
                isExtractingText = false
            }
        }
    }

    private func extractTextFromDocument(url: URL) async -> String? {
        // Start accessing the security-scoped resource
        let accessing = url.startAccessingSecurityScopedResource()
        defer { if accessing { url.stopAccessingSecurityScopedResource() } }

        // Try PDF extraction first
        if let pdfDoc = PDFDocument(url: url) {
            var fullText = ""
            for i in 0..<pdfDoc.pageCount {
                if let page = pdfDoc.page(at: i), let pageText = page.string {
                    fullText += pageText + "\n"
                }
            }
            if !fullText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                return fullText
            }
        }

        // Try reading as plain text (DOC/DOCX fallback)
        if let data = try? Data(contentsOf: url) {
            // Try attributed string for DOC/DOCX/RTF
            if let attrStr = try? NSAttributedString(data: data, options: [
                .documentType: NSAttributedString.DocumentType.rtf
            ], documentAttributes: nil) {
                return attrStr.string
            }

            // Plain text fallback
            if let plainText = String(data: data, encoding: .utf8) {
                return plainText
            }
        }

        return nil
    }

    private func extractTextFromImage(_ image: UIImage) async -> String? {
        guard let cgImage = image.cgImage else { return nil }

        return await withCheckedContinuation { continuation in
            let request = VNRecognizeTextRequest { request, error in
                guard let observations = request.results as? [VNRecognizedTextObservation] else {
                    continuation.resume(returning: nil)
                    return
                }
                let text = observations.compactMap { $0.topCandidates(1).first?.string }.joined(separator: "\n")
                continuation.resume(returning: text.isEmpty ? nil : text)
            }
            request.recognitionLevel = .accurate
            request.recognitionLanguages = ["fr-FR", "en-US"]

            let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
            do {
                try handler.perform([request])
            } catch {
                debugLog("❌ Vision OCR failed: \(error)")
                continuation.resume(returning: nil)
            }
        }
    }

    private var generateButton: some View {
        Button(action: {
            Task {
                isInputFocused = false
                await viewModel.generatePostWithAI(prompt: inputText)
            }
        }) {
            HStack(spacing: Spacing.sm) {
                Image(systemName: "sparkles")
                    .font(.headline)

                Text("Generate with AI")
                    .font(.headline)
                    .fontWeight(.semibold)
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(
                LinearGradient(
                    colors: [Color.appPrimary, Color.accentCyan],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .cornerRadius(CornerRadius.medium)
            .shadow(color: Color.appPrimary.opacity(0.4), radius: 15, x: 0, y: 8)
        }
    }

    // MARK: - Generated Content Section
    private var generatedContentSection: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            HStack {
                Text("Generated Post")
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(Color.adaptivePrimaryText(colorScheme))

                Spacer()

                Button(action: {
                    Task {
                        await viewModel.improveWithAI()
                    }
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: "wand.and.stars")
                            .font(.caption)
                        Text("Improve")
                            .font(.caption)
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(.accentCyan)
                    .padding(.horizontal, Spacing.sm)
                    .padding(.vertical, 6)
                    .background(Color.accentCyan.opacity(0.15))
                    .cornerRadius(CornerRadius.small)
                }
            }

            TextEditor(text: $viewModel.content)
                .frame(minHeight: 200)
                .padding(Spacing.md)
                .background(Color.adaptiveBackground(colorScheme))
                .cornerRadius(CornerRadius.medium)
                .onChange(of: viewModel.content) { oldValue, newValue in
                    // Recalculate hook score when user edits
                    viewModel.updateHookScore()
                }
        }
        .padding(Spacing.lg)
        .background(Color.adaptiveSecondaryBackground(colorScheme))
        .cornerRadius(CornerRadius.large)
    }

    // MARK: - Hook Score Section
    private var hookScoreSection: some View {
        VStack(spacing: Spacing.md) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Hook Score")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(Color.adaptiveSecondaryText(colorScheme))

                    Text("\(viewModel.hookScore)/100")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(hookScoreColor)
                }

                Spacer()

                ZStack {
                    Circle()
                        .stroke(Color.adaptiveBackground(colorScheme), lineWidth: 8)
                        .frame(width: 60, height: 60)

                    Circle()
                        .trim(from: 0, to: CGFloat(viewModel.hookScore) / 100.0)
                        .stroke(
                            LinearGradient(
                                colors: hookScoreGradient,
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            style: StrokeStyle(lineWidth: 8, lineCap: .round)
                        )
                        .frame(width: 60, height: 60)
                        .rotationEffect(.degrees(-90))
                        .animation(.appBouncy, value: viewModel.hookScore)

                    Text("\(viewModel.hookScore)")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(hookScoreColor)
                }
            }

            // Score description
            Text(hookScoreDescription)
                .font(.caption)
                .foregroundColor(Color.adaptiveSecondaryText(colorScheme))
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(Spacing.lg)
        .background(Color.adaptiveSecondaryBackground(colorScheme))
        .cornerRadius(CornerRadius.large)
    }

    private var hookScoreColor: Color {
        if viewModel.hookScore >= 70 { return .successGreen }
        else if viewModel.hookScore >= 40 { return .orange }
        else { return .errorRed }
    }

    private var hookScoreGradient: [Color] {
        if viewModel.hookScore >= 70 { return [.successGreen, .mint] }
        else if viewModel.hookScore >= 40 { return [.orange, .yellow] }
        else { return [.errorRed, .pink] }
    }

    private var hookScoreDescription: String {
        if viewModel.hookScore >= 70 { return "Excellent! This post is likely to get high engagement" }
        else if viewModel.hookScore >= 40 { return "Good start, but could be more engaging" }
        else { return "Consider improving the hook to increase engagement" }
    }

    // MARK: - AI Suggestion Card
    private func aiSuggestionCard(_ suggestion: String) -> some View {
        HStack(alignment: .top, spacing: Spacing.md) {
            Image(systemName: "lightbulb.fill")
                .font(.title3)
                .foregroundColor(.yellow)

            Text(suggestion)
                .font(.callout)
                .foregroundColor(Color.adaptivePrimaryText(colorScheme))
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(Spacing.lg)
        .background(
            LinearGradient(
                colors: [Color.yellow.opacity(0.1), Color.orange.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(CornerRadius.medium)
        .overlay(
            RoundedRectangle(cornerRadius: CornerRadius.medium)
                .stroke(Color.yellow.opacity(0.3), lineWidth: 1)
        )
    }

    // MARK: - Action Buttons
    private var actionButtons: some View {
        VStack(spacing: Spacing.md) {
            // Post now button
            Button(action: {
                Task {
                    await viewModel.publishPost()
                }
            }) {
                HStack(spacing: Spacing.sm) {
                    Image(systemName: "paperplane.fill")
                    Text("Post to LinkedIn")
                        .fontWeight(.semibold)
                }
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(
                    LinearGradient(
                        colors: [Color.appPrimary, Color.accentCyan],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(CornerRadius.medium)
                .shadow(color: Color.appPrimary.opacity(0.4), radius: 20, x: 0, y: 10)
            }
            .disabled(viewModel.isSaving)

            // Schedule button
            Button(action: {
                viewModel.schedule()
            }) {
                HStack(spacing: Spacing.sm) {
                    Image(systemName: "calendar.badge.clock")
                    Text("Schedule for Later")
                        .fontWeight(.medium)
                }
                .font(.callout)
                .foregroundColor(.appPrimary)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(Color.adaptiveSecondaryBackground(colorScheme))
                .cornerRadius(CornerRadius.medium)
                .overlay(
                    RoundedRectangle(cornerRadius: CornerRadius.medium)
                        .stroke(Color.appPrimary.opacity(0.3), lineWidth: 1)
                )
            }
            .disabled(viewModel.isSaving)
        }
    }

    // MARK: - Loading Overlay
    private var loadingOverlay: some View {
        ZStack {
            Color.black.opacity(0.4)
                .ignoresSafeArea()

            VStack(spacing: Spacing.lg) {
                ProgressView()
                    .scaleEffect(1.5)
                    .tint(.white)

                Text("AI is generating your post...")
                    .font(.headline)
                    .foregroundColor(.white)
            }
            .padding(Spacing.xl)
            .background(Color.adaptiveSecondaryBackground(colorScheme))
            .cornerRadius(CornerRadius.large)
            .shadow(radius: 30)
        }
    }

    // MARK: - Success Animation
    private var successAnimation: some View {
        ZStack {
            Color.black.opacity(0.4)
                .ignoresSafeArea()

            VStack(spacing: Spacing.lg) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 70))
                    .foregroundColor(.successGreen)

                Text(viewModel.successMessage)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)

                Text(viewModel.successMessage == "Post Scheduled!" ? "Your post has been scheduled" : "Your post is now live on LinkedIn")
                    .font(.callout)
                    .foregroundColor(.white.opacity(0.8))
            }
            .padding(Spacing.xxl)
            .background(Color.adaptiveSecondaryBackground(colorScheme))
            .cornerRadius(CornerRadius.large)
            .shadow(radius: 30)
        }
        .transition(.scale.combined(with: .opacity))
    }
}

// MARK: - Document Picker (PDF, DOC, DOCX)

struct DocumentPickerView: UIViewControllerRepresentable {
    var onPick: (URL) -> Void

    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let types: [UTType] = [.pdf, .rtf, .plainText, .text]
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: types, asCopy: true)
        picker.delegate = context.coordinator
        picker.allowsMultipleSelection = false
        return picker
    }

    func updateUIViewController(_ uiViewController: UIDocumentPickerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onPick: onPick)
    }

    class Coordinator: NSObject, UIDocumentPickerDelegate {
        var onPick: (URL) -> Void

        init(onPick: @escaping (URL) -> Void) {
            self.onPick = onPick
        }

        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            guard let url = urls.first else { return }
            onPick(url)
        }
    }
}

// MARK: - Camera Picker

struct CameraPickerView: UIViewControllerRepresentable {
    var onCapture: (UIImage) -> Void
    @Environment(\.dismiss) var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onCapture: onCapture, dismiss: dismiss)
    }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        var onCapture: (UIImage) -> Void
        var dismiss: DismissAction

        init(onCapture: @escaping (UIImage) -> Void, dismiss: DismissAction) {
            self.onCapture = onCapture
            self.dismiss = dismiss
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let image = info[.originalImage] as? UIImage {
                onCapture(image)
            }
            dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            dismiss()
        }
    }
}

#Preview {
    SmartAIEditorView(
        viewModel: SmartAIEditorHookScorerViewModel(sourceType: "From Ideas")
    )
}
