//
//  DebugLog.swift
//  Kuil
//
//  Debug-only logging utility. All calls are stripped from Release builds.
//

import Foundation

/// Debug-only print wrapper. Compiled out in Release builds for performance and privacy.
@inline(__always)
func debugLog(_ message: @autoclosure () -> String) {
    #if DEBUG
    print(message())
    #endif
}
