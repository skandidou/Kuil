/**
 * Jest Test Setup
 * Configures test environment with mocked dependencies
 */

// Mock environment variables for testing BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '1h';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-min';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.LINKEDIN_CLIENT_ID = 'test-linkedin-client-id';
process.env.LINKEDIN_CLIENT_SECRET = 'test-linkedin-client-secret';
process.env.LINKEDIN_REDIRECT_URI = 'http://localhost:3001/auth/callback';
process.env.FRONTEND_REDIRECT_URL = 'kuil://';
process.env.GEMINI_API_KEY = 'test-gemini-api-key';

// Force Jest to exit after all tests complete (fixes open handles from timers/connections)
afterAll(async () => {
  // Give time for any pending operations to complete
  await new Promise(resolve => setTimeout(resolve, 100));
});

// Export empty to make this a module
export {};
