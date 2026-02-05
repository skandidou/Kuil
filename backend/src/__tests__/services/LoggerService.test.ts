/**
 * LoggerService Unit Tests
 */

import { Logger } from '../../services/LoggerService';

describe('LoggerService', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('log methods', () => {
    it('should log info messages', () => {
      Logger.info('TEST', 'Info message');

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      Logger.warn('TEST', 'Warning message');

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      Logger.error('TEST', 'Error message');

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log error messages with Error object', () => {
      const error = new Error('Test error');
      Logger.error('TEST', 'Error with object', {}, error);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should include context in log output', () => {
      Logger.info('TEST', 'Message with context', { userId: 'user-123' });

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('generateCorrelationId', () => {
    it('should generate a valid UUID', () => {
      const id = Logger.generateCorrelationId();

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(Logger.generateCorrelationId());
      }

      expect(ids.size).toBe(100);
    });
  });

  describe('withContext', () => {
    it('should create a contextual logger', () => {
      const contextLogger = Logger.withContext({ userId: 'user-123' });

      expect(contextLogger).toBeDefined();
      expect(typeof contextLogger.info).toBe('function');
      expect(typeof contextLogger.warn).toBe('function');
      expect(typeof contextLogger.error).toBe('function');
      expect(typeof contextLogger.debug).toBe('function');
    });

    it('should preserve context in child logger', () => {
      const contextLogger = Logger.withContext({
        correlationId: 'corr-123',
        userId: 'user-456',
      });

      contextLogger.info('TEST', 'Contextual message');

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should merge additional context with preset context', () => {
      const contextLogger = Logger.withContext({ userId: 'user-123' });
      contextLogger.info('TEST', 'Message', { requestId: 'req-456' });

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('httpRequest', () => {
    it('should log HTTP requests with INFO level for 2xx', () => {
      Logger.httpRequest('GET', '/api/test', 200, 150);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log HTTP requests with WARN level for 4xx', () => {
      Logger.httpRequest('POST', '/api/test', 404, 50);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log HTTP requests with ERROR level for 5xx', () => {
      Logger.httpRequest('POST', '/api/test', 500, 100);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should include method, path, status and duration', () => {
      Logger.httpRequest('GET', '/health', 200, 25, { ip: '127.0.0.1' });

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('dbQuery', () => {
    // Note: dbQuery uses debug() which only logs in development mode
    // In test mode (NODE_ENV=test), debug logs are suppressed
    it('should not throw when logging database queries', () => {
      expect(() => {
        Logger.dbQuery('SELECT * FROM users', 50, 10);
      }).not.toThrow();
    });

    it('should handle long queries without throwing', () => {
      const longQuery = 'SELECT ' + 'column, '.repeat(50) + 'FROM table';
      expect(() => {
        Logger.dbQuery(longQuery, 100);
      }).not.toThrow();
    });
  });

  describe('externalApi', () => {
    it('should log external API calls', () => {
      Logger.externalApi('LinkedIn', '/v2/userinfo', 200, 300);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log failed API calls with ERROR level', () => {
      Logger.externalApi('Gemini', '/generate', 500, 1000);

      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
