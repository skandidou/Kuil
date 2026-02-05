/**
 * Auth Routes Integration Tests
 */

import request from 'supertest';
import express from 'express';

// Create a minimal test app for auth endpoints
const createAuthTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock LinkedIn auth endpoint
  app.get('/auth/linkedin', (req, res) => {
    const state = 'mock-state-' + Date.now();
    const redirectUrl = `https://www.linkedin.com/oauth/v2/authorization?client_id=test&redirect_uri=test&state=${state}&scope=openid%20profile%20email%20w_member_social`;
    res.json({ url: redirectUrl, state });
  });

  // Mock callback validation (without actual LinkedIn call)
  app.get('/auth/callback', (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
      return res.status(400).json({ error: 'OAuth error', message: error });
    }

    if (!code || !state) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing code or state parameter',
      });
    }

    // In real app, this would exchange code for token
    // For testing, we just validate the parameters exist
    res.json({ success: true, message: 'Callback received' });
  });

  // Mock refresh token endpoint
  app.post('/auth/refresh', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing authorization header',
      });
    }

    // Mock token refresh
    res.json({
      token: 'new-mock-jwt-token',
      expiresIn: '7d',
    });
  });

  return app;
};

describe('Auth Routes', () => {
  const app = createAuthTestApp();

  describe('GET /auth/linkedin', () => {
    it('should return LinkedIn OAuth URL', async () => {
      const response = await request(app).get('/auth/linkedin');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('state');
      expect(response.body.url).toContain('linkedin.com');
    });

    it('should include required OAuth parameters in URL', async () => {
      const response = await request(app).get('/auth/linkedin');
      const url = response.body.url;

      expect(url).toContain('client_id=');
      expect(url).toContain('redirect_uri=');
      expect(url).toContain('state=');
      expect(url).toContain('scope=');
    });
  });

  describe('GET /auth/callback', () => {
    it('should handle successful callback with code and state', async () => {
      const response = await request(app)
        .get('/auth/callback')
        .query({ code: 'mock-auth-code', state: 'mock-state' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 when code is missing', async () => {
      const response = await request(app)
        .get('/auth/callback')
        .query({ state: 'mock-state' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 when state is missing', async () => {
      const response = await request(app)
        .get('/auth/callback')
        .query({ code: 'mock-auth-code' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should handle OAuth error parameter', async () => {
      const response = await request(app)
        .get('/auth/callback')
        .query({ error: 'access_denied' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('OAuth error');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token with valid authorization', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('expiresIn');
    });

    it('should return 401 without authorization header', async () => {
      const response = await request(app).post('/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 401 with invalid authorization format', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', 'Basic invalid');

      expect(response.status).toBe(401);
    });
  });
});
