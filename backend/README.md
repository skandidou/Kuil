# Kuil Backend API

Backend server for Kuil - LinkedIn OAuth authentication + Gemini AI integration.

## 🚀 Features

- **LinkedIn OAuth 2.0** - Secure authentication flow
- **Gemini AI Integration** - Voice signature analysis & content generation
- **PostgreSQL Database** - User data, posts, voice signatures
- **JWT Authentication** - Secure API access for iOS app
- **TypeScript** - Type-safe codebase
- **Express.js** - Fast, minimal web framework

## 📦 Prerequisites

- Node.js >= 18.0.0
- PostgreSQL database (or Railway)
- LinkedIn OAuth App credentials
- Gemini AI API key

## 🔧 Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
nano .env
```

## 🗄️ Database Setup

```bash
# Run migrations
npm run migrate
```

This will create the following tables:
- `users` - User profiles and LinkedIn tokens (encrypted)
- `voice_signatures` - AI-analyzed voice signatures
- `linkedin_posts` - Cached LinkedIn posts
- `generated_posts` - AI-generated content

## 🏃 Running Locally

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

Server will start at `http://localhost:3000`

## 📡 API Endpoints

### Authentication

```
GET  /auth/linkedin          Initiate LinkedIn OAuth flow
GET  /auth/callback          OAuth callback (handles code exchange)
POST /auth/refresh           Refresh JWT token
```

### LinkedIn

```
GET  /api/linkedin/profile   Get user's LinkedIn profile
GET  /api/linkedin/posts     Fetch user's LinkedIn posts
POST /api/linkedin/publish   Publish new post to LinkedIn
```

### Voice Analysis (Gemini AI)

```
POST /api/voice/analyze      Analyze posts → generate voice signature
GET  /api/voice/signature    Get current voice signature
POST /api/voice/generate     Generate post variants from topic
```

### User

```
GET  /api/user/profile       Get full user profile + voice signature
GET  /api/user/stats         Get user statistics
```

### Health

```
GET  /health                 Health check + database status
GET  /                       API documentation
```

## 🔐 Environment Variables

Required variables (see `.env.example`):

```env
# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/callback

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kuil

# Frontend
FRONTEND_REDIRECT_URL=kuil://auth/success

# Encryption (for LinkedIn tokens)
ENCRYPTION_KEY=your_32_character_encryption_key
```

## 🚢 Deployment to Railway

### Option 1: GitHub Integration (Recommended)

1. Push code to GitHub repository
2. Go to [Railway Dashboard](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Node.js and deploys

### Option 2: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Add PostgreSQL Database

1. In Railway dashboard, click "New" → "Database" → "PostgreSQL"
2. Railway auto-generates `DATABASE_URL` environment variable
3. Run migrations:

```bash
railway run npm run migrate
```

### Configure Environment Variables

In Railway dashboard → Variables tab, add:
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_REDIRECT_URI` (use Railway URL)
- `GEMINI_API_KEY`
- `JWT_SECRET`
- `FRONTEND_REDIRECT_URL` = `kuil://auth/success`
- `ENCRYPTION_KEY`
- `NODE_ENV` = `production`

### Update iOS App Config

Update `Config.swift` with your Railway URL:

```swift
static let backendURL = "https://your-app.railway.app"
```

## 📝 Testing

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test OAuth flow
# Open in browser:
open http://localhost:3000/auth/linkedin

# Test authenticated endpoint
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/user/profile
```

## 🔒 Security

- ✅ LinkedIn tokens are encrypted before storage
- ✅ JWT tokens for iOS authentication
- ✅ Helmet.js for security headers
- ✅ CORS enabled
- ✅ SQL injection prevention (parameterized queries)
- ✅ Environment variables for secrets

## 📚 Architecture

```
Backend
├── src/
│   ├── server.ts              Entry point
│   ├── config/
│   │   ├── database.ts        PostgreSQL connection
│   │   ├── env.ts             Environment variables
│   │   ├── schema.sql         Database schema
│   │   └── migrate.ts         Migration script
│   ├── routes/
│   │   ├── auth.routes.ts     OAuth endpoints
│   │   ├── linkedin.routes.ts LinkedIn API
│   │   ├── gemini.routes.ts   Gemini AI
│   │   └── user.routes.ts     User management
│   ├── services/
│   │   ├── AuthService.ts     JWT + encryption
│   │   ├── LinkedInService.ts LinkedIn API calls
│   │   └── GeminiService.ts   Gemini AI integration
│   ├── models/
│   │   ├── User.ts
│   │   ├── VoiceSignature.ts
│   │   ├── LinkedInPost.ts
│   │   └── GeneratedPost.ts
│   └── middleware/
│       └── auth.middleware.ts JWT verification
```

## 🐛 Troubleshooting

### Database connection errors

```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Test connection manually
psql $DATABASE_URL
```

### LinkedIn OAuth errors

- Verify redirect URI matches in LinkedIn Developer Portal
- Check CLIENT_ID and CLIENT_SECRET are correct
- Ensure all scopes are enabled in LinkedIn app settings

### Gemini AI errors

- Verify API key is valid
- Check quota/billing in Google Cloud Console
- Ensure model name is correct (`gemini-pro`)

## 📄 License

MIT

## 👥 Support

For issues, please create a GitHub issue or contact support.
