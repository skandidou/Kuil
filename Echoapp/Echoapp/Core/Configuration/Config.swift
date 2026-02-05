//
//  Config.swift
//  Kuil
//
//  Created by Claude on 16/01/2026.
//

import Foundation

struct Config {
    // MARK: - Backend Configuration
    // TODO: Change to https://api.kuil.ai once DNS is configured on Railway
    #if DEBUG
    static let backendURL = "https://echoapp-backend-production-699c.up.railway.app" // Development (Railway)
    #else
    static let backendURL = "https://echoapp-backend-production-699c.up.railway.app" // Production (Railway)
    #endif

    // MARK: - Website
    static let websiteURL = "https://kuil.ai"

    // MARK: - LinkedIn OAuth
    static let linkedInClientID = "78e3x33e8sm40q"
    static let linkedInRedirectURI = "\(backendURL)/auth/callback"
    static let linkedInAuthURL = "https://www.linkedin.com/oauth/v2/authorization"

    // MARK: - API Endpoints
    struct Endpoints {
        // Auth
        static let authLinkedIn = "/auth/linkedin"
        static let authCallback = "/auth/callback"
        static let authRefresh = "/auth/refresh"

        // LinkedIn
        static let linkedInProfile = "/api/linkedin/profile"
        static let linkedInPosts = "/api/linkedin/posts"
        static let linkedInPublish = "/api/linkedin/publish"

        // Voice (Gemini)
        static let voiceAnalyze = "/api/voice/analyze"
        static let voiceSignature = "/api/voice/signature"
        static let voiceGenerate = "/api/voice/generate"

        // User
        static let userProfile = "/api/user/profile"
        static let userStats = "/api/user/stats"
    }

    // MARK: - App Configuration
    static let jwtTokenKey = "kuil_jwt_token"
    static let appURLScheme = "kuil"
}
