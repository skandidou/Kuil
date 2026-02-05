import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  version: process.env.APP_VERSION || '1.0.0',

  // LinkedIn OAuth
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID!,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    redirectUri: process.env.LINKEDIN_REDIRECT_URI!,
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    apiUrl: 'https://api.linkedin.com/v2',
    userInfoUrl: 'https://api.linkedin.com/v2/userinfo',
    scopes: ['openid', 'profile', 'email', 'w_member_social'],
  },

  // Gemini AI (legacy - kept for fallback)
  gemini: {
    apiKey: process.env.GEMINI_API_KEY!,
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  },

  // Claude AI (primary)
  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: process.env.CLAUDE_MODEL || 'claude-opus-4-20250514',
  },

  // Apify (LinkedIn Posts Scraping - optional)
  apify: {
    apiKey: process.env.APIFY_API_KEY,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET!, // No default - validated at startup
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string,
  },

  // Database
  database: {
    url: process.env.DATABASE_URL!,
  },

  // Redis (optional - falls back to in-memory if not configured)
  redis: {
    url: process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL,
  },

  // Frontend
  frontend: {
    redirectUrl: process.env.FRONTEND_REDIRECT_URL!,
  },

  // Encryption
  encryption: {
    key: process.env.ENCRYPTION_KEY!, // No default - validated at startup
  },
};

// Validation au démarrage (skip in test environment)
const requiredEnvVars = [
  'LINKEDIN_CLIENT_ID',
  'LINKEDIN_CLIENT_SECRET',
  'ANTHROPIC_API_KEY',
  'JWT_SECRET',
  'DATABASE_URL',
  'ENCRYPTION_KEY',
];

// Don't validate in test environment - tests use mocks
if (process.env.NODE_ENV !== 'test') {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
  console.log('✅ Environment variables validated');
}
