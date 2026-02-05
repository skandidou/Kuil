//
//  ATTService.swift
//  Kuil
//
//  App Tracking Transparency service for managing tracking permissions
//

import Foundation
import AppTrackingTransparency
import AdSupport

/// Service for managing App Tracking Transparency (ATT) permissions
class ATTService: ObservableObject {
    static let shared = ATTService()

    @Published var trackingStatus: ATTrackingManager.AuthorizationStatus = .notDetermined
    @Published var hasRequestedPermission: Bool = false

    private let hasRequestedKey = "hasRequestedATTPermission"

    private init() {
        // Load saved state
        hasRequestedPermission = UserDefaults.standard.bool(forKey: hasRequestedKey)
        trackingStatus = ATTrackingManager.trackingAuthorizationStatus
    }

    /// Check if we should show ATT request
    var shouldRequestPermission: Bool {
        return !hasRequestedPermission && trackingStatus == .notDetermined
    }

    /// Check if tracking is authorized
    var isTrackingAuthorized: Bool {
        return trackingStatus == .authorized
    }

    /// Get IDFA if authorized
    var advertisingIdentifier: String? {
        guard isTrackingAuthorized else { return nil }
        let idfa = ASIdentifierManager.shared().advertisingIdentifier.uuidString
        // Check if IDFA is all zeros (means tracking not available)
        if idfa == "00000000-0000-0000-0000-000000000000" {
            return nil
        }
        return idfa
    }

    /// Request tracking authorization
    @MainActor
    func requestTrackingAuthorization() async -> ATTrackingManager.AuthorizationStatus {
        // Mark as requested regardless of outcome
        hasRequestedPermission = true
        UserDefaults.standard.set(true, forKey: hasRequestedKey)

        // Request permission
        let status = await ATTrackingManager.requestTrackingAuthorization()
        trackingStatus = status

        // Log result
        switch status {
        case .authorized:
            print("[ATT] Tracking authorized - IDFA: \(advertisingIdentifier ?? "N/A")")
        case .denied:
            print("[ATT] Tracking denied by user")
        case .restricted:
            print("[ATT] Tracking restricted (parental controls, etc.)")
        case .notDetermined:
            print("[ATT] Tracking status not determined")
        @unknown default:
            print("[ATT] Unknown tracking status")
        }

        return status
    }

    /// Skip ATT request (user dismissed without choosing)
    func skipRequest() {
        hasRequestedPermission = true
        UserDefaults.standard.set(true, forKey: hasRequestedKey)
        print("[ATT] User skipped ATT request")
    }

    /// Reset for testing purposes
    func resetForTesting() {
        hasRequestedPermission = false
        UserDefaults.standard.set(false, forKey: hasRequestedKey)
        print("[ATT] Reset for testing")
    }
}
