//
//  AIProfileAnalysisLoadingViewModel.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI
import Combine

@MainActor
class AIProfileAnalysisLoadingViewModel: ObservableObject {
    @Published var progress: Double = 0.0
    @Published var isCompleted: Bool = false
    
    private var timer: Timer?
    
    func startAnalysis() {
        progress = 0.0
        isCompleted = false
        
        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] timer in
            Task { @MainActor in
                guard let self = self else {
                    timer.invalidate()
                    return
                }
                
                self.progress += 0.01
                
                if self.progress >= 1.0 {
                    self.progress = 1.0
                    self.isCompleted = true
                    timer.invalidate()
                    
                    // Navigate to next screen
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        NotificationCenter.default.post(name: .profileAnalysisCompleted, object: nil)
                    }
                }
            }
        }
    }
    
    func cancel() {
        timer?.invalidate()
        NotificationCenter.default.post(name: .profileAnalysisCancelled, object: nil)
    }
}

extension Notification.Name {
    static let profileAnalysisCompleted = Notification.Name("profileAnalysisCompleted")
    static let profileAnalysisCancelled = Notification.Name("profileAnalysisCancelled")
}
