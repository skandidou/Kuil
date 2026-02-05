import { Router, Request, Response } from 'express';
import { config } from '../config/env';
import { query } from '../config/database';
import { AuthService } from '../services/AuthService';
import { LinkedInService } from '../services/LinkedInService';
import { CacheService } from '../services/CacheService';
import { Logger } from '../services/LoggerService';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// OAuth state TTL: 5 minutes
const STATE_EXPIRY_MS = 5 * 60 * 1000;
const OAUTH_STATE_PREFIX = 'oauth_state:';

/**
 * GET /auth/linkedin
 * Initiate LinkedIn OAuth flow
 */
router.get('/linkedin', async (req: Request, res: Response) => {
  const correlationId = Logger.generateCorrelationId();
  const logger = Logger.withContext({ correlationId });

  try {
    const state = AuthService.generateState();

    // Store state in Redis with expiration for CSRF validation
    const cacheKey = `${OAUTH_STATE_PREFIX}${state}`;
    await CacheService.set(cacheKey, { created: Date.now() }, STATE_EXPIRY_MS);

    logger.info('AUTH', 'OAuth flow initiated', { state: state.substring(0, 8) + '...' });

    const authUrl = new URL(config.linkedin.authUrl);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', config.linkedin.clientId);
    authUrl.searchParams.append('redirect_uri', config.linkedin.redirectUri);
    authUrl.searchParams.append('scope', config.linkedin.scopes.join(' '));
    authUrl.searchParams.append('state', state);

    res.redirect(authUrl.toString());
  } catch (error: any) {
    logger.error('AUTH', 'Failed to initiate OAuth', {}, error);
    res.status(500).json({ error: 'Failed to initiate authentication' });
  }
});

/**
 * GET /auth/callback
 * LinkedIn OAuth callback
 */
router.get('/callback', async (req: Request, res: Response) => {
  const correlationId = Logger.generateCorrelationId();
  const logger = Logger.withContext({ correlationId });

  try {
    const { code, state, error, error_description } = req.query;

    // Validate OAuth state to prevent CSRF attacks
    if (!state || typeof state !== 'string') {
      logger.warn('AUTH', 'OAuth callback: Missing state parameter');
      const errorUrl = `${config.frontend.redirectUrl}?error=invalid_state`;
      return res.send(generateErrorPage('Invalid request', errorUrl));
    }

    // Check state in Redis
    const cacheKey = `${OAUTH_STATE_PREFIX}${state}`;
    const stateData = await CacheService.get(cacheKey);

    if (!stateData) {
      logger.warn('AUTH', 'OAuth callback: Invalid or expired state', { state: state.substring(0, 8) + '...' });
      const errorUrl = `${config.frontend.redirectUrl}?error=invalid_state`;
      return res.send(generateErrorPage('Session expired. Please try again.', errorUrl));
    }

    // State is valid, remove it (one-time use)
    await CacheService.delete(cacheKey);

    if (error) {
      logger.error('AUTH', 'LinkedIn OAuth error', { error, error_description });
      const errorUrl = `${config.frontend.redirectUrl}?error=${error}`;
      return res.send(generateErrorPage('Authentication error', errorUrl));
    }

    if (!code || typeof code !== 'string') {
      const errorUrl = `${config.frontend.redirectUrl}?error=missing_code`;
      return res.send(generateErrorPage('Missing authorization code', errorUrl));
    }

    // Exchange code for access token
    logger.info('AUTH', 'Exchanging authorization code for access token');
    const tokenData = await LinkedInService.exchangeCodeForToken(code);
    logger.info('AUTH', 'Access token received');

    // Get LinkedIn profile using OpenID Connect userinfo endpoint
    logger.info('AUTH', 'Fetching user profile from LinkedIn');
    const profile = await LinkedInService.getUserProfile(tokenData.access_token);
    logger.info('AUTH', 'Profile fetched', { sub: profile.sub, name: profile.name });

    // Encrypt tokens
    const encryptedAccessToken = AuthService.encryptToken(tokenData.access_token);
    const encryptedRefreshToken = tokenData.refresh_token
      ? AuthService.encryptToken(tokenData.refresh_token)
      : null;

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Upsert user with OpenID Connect profile data
    logger.info('AUTH', 'Upserting user in database');
    const userResult = await query(
      `INSERT INTO users (linkedin_id, name, email, profile_picture, linkedin_access_token, linkedin_refresh_token, token_expires_at, last_login_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (linkedin_id)
       DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         profile_picture = EXCLUDED.profile_picture,
         linkedin_access_token = EXCLUDED.linkedin_access_token,
         linkedin_refresh_token = EXCLUDED.linkedin_refresh_token,
         token_expires_at = EXCLUDED.token_expires_at,
         last_login_at = NOW(),
         updated_at = NOW()
       RETURNING id`,
      [
        profile.sub,
        profile.name,
        profile.email,
        profile.picture || null,
        encryptedAccessToken,
        encryptedRefreshToken,
        expiresAt,
      ]
    );

    const userId = userResult.rows[0].id;
    logger.info('AUTH', 'User upserted', { userId });

    // Fetch and cache LinkedIn posts for visibility score calculation
    try {
      logger.info('AUTH', 'Fetching LinkedIn posts for visibility score');
      const linkedInPosts = await LinkedInService.getUserPosts(
        profile.sub,
        tokenData.access_token
      );

      if (linkedInPosts.length > 0) {
        await LinkedInService.cacheUserPosts(userId, linkedInPosts);
        logger.info('AUTH', `Cached ${linkedInPosts.length} LinkedIn posts`);
      } else {
        logger.info('AUTH', 'No LinkedIn posts found to cache');
      }
    } catch (postError: any) {
      logger.warn('AUTH', 'Failed to cache LinkedIn posts (non-critical)', {}, postError);
      // Don't block auth if this fails
    }

    // Generate JWT for iOS
    logger.info('AUTH', 'Generating JWT token');
    const jwt = AuthService.generateJWT(userId);

    // Direct redirect to iOS app - no intermediate page
    const redirectUrl = `${config.frontend.redirectUrl}?token=${jwt}`;
    logger.info('AUTH', 'OAuth flow completed successfully', { userId });

    // Use 302 redirect for instant return to app
    res.redirect(302, redirectUrl);
  } catch (error: any) {
    logger.error('AUTH', 'OAuth callback error', {
      message: error.message,
      response: error.response?.data,
    }, error);

    const errorMessage = error.message || 'auth_failed';
    const errorUrl = `${config.frontend.redirectUrl}?error=${encodeURIComponent(errorMessage)}`;

    res.send(generateErrorPage(error.message || 'An error occurred during authentication', errorUrl));
  }
});

/**
 * POST /auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const correlationId = Logger.generateCorrelationId();
  const logger = Logger.withContext({ correlationId });

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const decoded = AuthService.verifyJWT(token);

    if (!decoded) {
      logger.warn('AUTH', 'Invalid token for refresh');
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Generate new JWT
    const newJWT = AuthService.generateJWT(decoded.userId);
    logger.info('AUTH', 'Token refreshed', { userId: decoded.userId });

    res.json({ token: newJWT });
  } catch (error: any) {
    logger.error('AUTH', 'Token refresh error', {}, error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// ============================================================================
// LinkedIn Analytics OAuth (Community Management API - separate app)
// ============================================================================

const ANALYTICS_STATE_PREFIX = 'analytics_oauth_state:';

/**
 * GET /auth/linkedin-analytics
 * Initiate LinkedIn OAuth flow for Community Management API (analytics)
 * Requires user to be already logged in
 */
router.get('/linkedin-analytics', authenticate, async (req: AuthRequest, res: Response) => {
  const correlationId = Logger.generateCorrelationId();
  const logger = Logger.withContext({ correlationId });

  try {
    // Check if analytics credentials are configured
    if (!config.linkedinAnalytics.clientId || !config.linkedinAnalytics.clientSecret) {
      logger.error('AUTH', 'LinkedIn Analytics credentials not configured');
      return res.status(500).json({ error: 'Analytics not configured' });
    }

    const state = AuthService.generateState();

    // Store state with user ID in Redis for callback validation
    const cacheKey = `${ANALYTICS_STATE_PREFIX}${state}`;
    await CacheService.set(cacheKey, { userId: req.userId, created: Date.now() }, STATE_EXPIRY_MS);

    logger.info('AUTH', 'Analytics OAuth flow initiated', {
      userId: req.userId,
      state: state.substring(0, 8) + '...',
    });

    // Build redirect URI for analytics callback
    const redirectUri = config.linkedinAnalytics.redirectUri ||
      config.linkedin.redirectUri.replace('/callback', '/analytics/callback');

    const authUrl = new URL(config.linkedinAnalytics.authUrl);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', config.linkedinAnalytics.clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', config.linkedinAnalytics.scopes.join(' '));
    authUrl.searchParams.append('state', state);

    res.redirect(authUrl.toString());
  } catch (error: any) {
    logger.error('AUTH', 'Failed to initiate analytics OAuth', {}, error);
    res.status(500).json({ error: 'Failed to initiate analytics authentication' });
  }
});

/**
 * GET /auth/analytics/callback
 * LinkedIn OAuth callback for Community Management API
 */
router.get('/analytics/callback', async (req: Request, res: Response) => {
  const correlationId = Logger.generateCorrelationId();
  const logger = Logger.withContext({ correlationId });

  try {
    const { code, state, error, error_description } = req.query;

    // Validate OAuth state
    if (!state || typeof state !== 'string') {
      logger.warn('AUTH', 'Analytics callback: Missing state parameter');
      const errorUrl = `${config.frontend.redirectUrl}?analytics_error=invalid_state`;
      return res.send(generateErrorPage('Invalid request', errorUrl));
    }

    // Check state in Redis and get user ID
    const cacheKey = `${ANALYTICS_STATE_PREFIX}${state}`;
    const stateData = await CacheService.get(cacheKey) as { userId: string; created: number } | null;

    if (!stateData || !stateData.userId) {
      logger.warn('AUTH', 'Analytics callback: Invalid or expired state', { state: state.substring(0, 8) + '...' });
      const errorUrl = `${config.frontend.redirectUrl}?analytics_error=invalid_state`;
      return res.send(generateErrorPage('Session expired. Please try again.', errorUrl));
    }

    const userId = stateData.userId;

    // State is valid, remove it (one-time use)
    await CacheService.delete(cacheKey);

    if (error) {
      logger.error('AUTH', 'LinkedIn Analytics OAuth error', { error, error_description, userId });
      const errorUrl = `${config.frontend.redirectUrl}?analytics_error=${error}`;
      return res.send(generateErrorPage('Analytics authentication error', errorUrl));
    }

    if (!code || typeof code !== 'string') {
      const errorUrl = `${config.frontend.redirectUrl}?analytics_error=missing_code`;
      return res.send(generateErrorPage('Missing authorization code', errorUrl));
    }

    // Build redirect URI (same as in initiation)
    const redirectUri = config.linkedinAnalytics.redirectUri ||
      config.linkedin.redirectUri.replace('/callback', '/analytics/callback');

    // Exchange code for access token using Analytics app credentials
    logger.info('AUTH', 'Exchanging analytics authorization code for access token', { userId });

    const tokenResponse = await fetch(config.linkedinAnalytics.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: config.linkedinAnalytics.clientId,
        client_secret: config.linkedinAnalytics.clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      logger.error('AUTH', 'Analytics token exchange failed', { status: tokenResponse.status, error: errorData });
      const errorUrl = `${config.frontend.redirectUrl}?analytics_error=token_exchange_failed`;
      return res.send(generateErrorPage('Failed to get analytics access', errorUrl));
    }

    const tokenData = await tokenResponse.json() as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
    };

    logger.info('AUTH', 'Analytics access token received', { userId });

    // Encrypt and store analytics token
    const encryptedAnalyticsToken = AuthService.encryptToken(tokenData.access_token);
    const analyticsTokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    await query(
      `UPDATE users
       SET linkedin_analytics_token = $1,
           linkedin_analytics_token_expires_at = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [encryptedAnalyticsToken, analyticsTokenExpiresAt, userId]
    );

    logger.info('AUTH', 'Analytics token stored successfully', { userId });

    // Redirect back to app with success
    const successUrl = `${config.frontend.redirectUrl}?analytics_connected=true`;
    res.redirect(302, successUrl);
  } catch (error: any) {
    logger.error('AUTH', 'Analytics OAuth callback error', {
      message: error.message,
    }, error);

    const errorUrl = `${config.frontend.redirectUrl}?analytics_error=callback_failed`;
    res.send(generateErrorPage('An error occurred during analytics authentication', errorUrl));
  }
});

/**
 * GET /auth/analytics/status
 * Check if user has connected LinkedIn Analytics
 */
router.get('/analytics/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT linkedin_analytics_token, linkedin_analytics_token_expires_at
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { linkedin_analytics_token, linkedin_analytics_token_expires_at } = result.rows[0];

    const isConnected = !!linkedin_analytics_token;
    const isExpired = linkedin_analytics_token_expires_at
      ? new Date(linkedin_analytics_token_expires_at) < new Date()
      : false;

    res.json({
      connected: isConnected && !isExpired,
      expired: isExpired,
    });
  } catch (error) {
    console.error('Analytics status error:', error);
    res.status(500).json({ error: 'Failed to check analytics status' });
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate success page HTML - Instant redirect, minimal page
 * The page content is just a fallback if JS redirect fails
 */
function generateSuccessPage(redirectUrl: string): string {
  // Use HTTP redirect header for fastest possible redirect
  // The HTML is just a fallback
  return `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${redirectUrl}"><script>window.location.replace("${redirectUrl}");</script></head><body></body></html>`;
}

/**
 * Sanitize string for safe HTML rendering (prevent XSS)
 */
function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate error page HTML
 */
function generateErrorPage(message: string, redirectUrl: string): string {
  // Sanitize inputs to prevent XSS
  const safeMessage = sanitizeHtml(message);
  const safeRedirectUrl = encodeURI(redirectUrl);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          text-align: center;
          padding: 20px;
        }
        .container { max-width: 400px; }
        h1 { font-size: 28px; margin-bottom: 16px; }
        p { font-size: 16px; margin-bottom: 32px; opacity: 0.9; }
        .button {
          display: inline-block;
          background: white;
          color: #f5576c;
          text-decoration: none;
          padding: 16px 48px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      </style>
      <script>
        setTimeout(function() {
          window.location.href = "${safeRedirectUrl}";
        }, 2000);
      </script>
    </head>
    <body>
      <div class="container">
        <h1>Authentication Failed</h1>
        <p>${safeMessage}</p>
        <a href="${safeRedirectUrl}" class="button">Return to App</a>
      </div>
    </body>
    </html>
  `;
}

export default router;
