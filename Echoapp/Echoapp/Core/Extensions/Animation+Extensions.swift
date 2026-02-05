//
//  Animation+Extensions.swift
//  Kuil
//
//  Created by Skander Mabrouk on 12/01/2026.
//

import SwiftUI

extension Animation {
    static let smoothSpring = Animation.spring(response: 0.4, dampingFraction: 0.8)
    static let quickSpring = Animation.spring(response: 0.3, dampingFraction: 0.7)
    static let bouncySpring = Animation.spring(response: 0.5, dampingFraction: 0.6)

    // App-wide animation presets
    static let appDefault = Animation.spring(response: 0.4, dampingFraction: 0.8)
    static let appQuick = Animation.spring(response: 0.3, dampingFraction: 0.7)
    static let appBouncy = Animation.spring(response: 0.5, dampingFraction: 0.6)
    static let appSmooth = Animation.easeInOut(duration: 0.3)
}
