/**
 * Health Endpoint Integration Tests
 */

import request from 'supertest';
import express from 'express';

// Create a minimal test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock health endpoint
  app.get('/health', async (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'test',
      uptime: process.uptime(),
      checks: {
        database: { status: 'healthy', latency: 10 },
        cache: { status: 'healthy', latency: 5, mode: 'memory' },
        scheduler: { status: 'healthy' },
      },
      responseTime: 15,
    });
  });

  app.get('/ready', (req, res) => {
    res.json({ ready: true });
  });

  app.get('/live', (req, res) => {
    res.json({ live: true });
  });

  return app;
};

describe('Health Endpoints', () => {
  const app = createTestApp();

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('checks');
    });

    it('should include all service checks', async () => {
      const response = await request(app).get('/health');

      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('cache');
      expect(response.body.checks).toHaveProperty('scheduler');
    });

    it('should include response time', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toHaveProperty('responseTime');
      expect(typeof response.body.responseTime).toBe('number');
    });
  });

  describe('GET /ready', () => {
    it('should return ready status', async () => {
      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ready: true });
    });
  });

  describe('GET /live', () => {
    it('should return live status', async () => {
      const response = await request(app).get('/live');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ live: true });
    });
  });
});
