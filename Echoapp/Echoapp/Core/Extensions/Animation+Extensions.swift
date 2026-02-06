//
//  Animation+Extensions.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

extension Animation {
    static let smoothSpring = Animation.spring(response: 0.4, dampingFraction: 0.85)
    static let quickSpring = Animation.spring(response: 0.3, dampingFraction: 0.8)
    static let bouncySpring = Animation.spring(response: 0.45, dampingFraction: 0.65)

    // App-wide animation presets
    static let appDefault = Animation.spring(response: 0.4, dampingFraction: 0.85)
    static let appQuick = Animation.spring(response: 0.25, dampingFraction: 0.8)
    static let appBouncy = Animation.spring(response: 0.45, dampingFraction: 0.65)
    static let appSmooth = Animation.easeInOut(duration: 0.3)
    static let appSubtle = Animation.easeOut(duration: 0.2)
}
