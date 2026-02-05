/**
 * CacheService Unit Tests
 */

import { CacheService } from '../../services/CacheService';

describe('CacheService', () => {
  beforeAll(async () => {
    // Initialize with in-memory fallback for testing
    await CacheService.initialize();
  });

  afterAll(async () => {
    await CacheService.shutdown();
  });

  beforeEach(async () => {
    // Clear cache before each test
    await CacheService.delete('test-key');
    await CacheService.delete('test-key-1');
    await CacheService.delete('test-key-2');
    await CacheService.delete('counter-key');
    await CacheService.delete('new-counter');
  });

  describe('set and get', () => {
    it('should store and retrieve a string value', async () => {
      await CacheService.set('test-key', 'test-value', 60000);
      const value = await CacheService.get<string>('test-key');

      expect(value).toBe('test-value');
    });

    it('should store and retrieve an object value', async () => {
      const obj = { name: 'test', count: 42 };
      await CacheService.set('test-key', obj, 60000);
      const value = await CacheService.get<typeof obj>('test-key');

      expect(value).toEqual(obj);
    });

    it('should return null for non-existent key', async () => {
      const value = await CacheService.get('non-existent-key');

      expect(value).toBeNull();
    });

    it('should overwrite existing value', async () => {
      await CacheService.set('test-key', 'value-1', 60000);
      await CacheService.set('test-key', 'value-2', 60000);
      const value = await CacheService.get<string>('test-key');

      expect(value).toBe('value-2');
    });
  });

  describe('delete', () => {
    it('should delete an existing key', async () => {
      await CacheService.set('test-key', 'value', 60000);
      await CacheService.delete('test-key');
      const value = await CacheService.get('test-key');

      expect(value).toBeNull();
    });

    it('should not throw when deleting non-existent key', async () => {
      await expect(CacheService.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('increment', () => {
    it('should increment a counter', async () => {
      const ttl = 60000; // 60 seconds
      const count1 = await CacheService.increment('counter-key', ttl);
      const count2 = await CacheService.increment('counter-key', ttl);
      const count3 = await CacheService.increment('counter-key', ttl);

      expect(count1).toBe(1);
      expect(count2).toBe(2);
      expect(count3).toBe(3);
    });

    it('should start from 0 for new keys', async () => {
      const count = await CacheService.increment('new-counter', 60000);
      expect(count).toBe(1);

      // Cleanup
      await CacheService.delete('new-counter');
    });
  });

  describe('exists', () => {
    it('should return true for existing key', async () => {
      await CacheService.set('test-key', 'value', 60000);
      const exists = await CacheService.exists('test-key');

      expect(exists).toBe(true);
    });

    it('should return false for non-existent key', async () => {
      const exists = await CacheService.exists('non-existent-key');

      expect(exists).toBe(false);
    });
  });

  describe('getCount', () => {
    it('should return 0 for non-existent counter', async () => {
      const count = await CacheService.getCount('non-existent-counter');

      expect(count).toBe(0);
    });

    it('should return current count after increments', async () => {
      await CacheService.increment('counter-key', 60000);
      await CacheService.increment('counter-key', 60000);
      const count = await CacheService.getCount('counter-key');

      expect(count).toBe(2);
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const health = await CacheService.healthCheck();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('latency');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
      expect(typeof health.latency).toBe('number');
    });
  });

  describe('isConnected', () => {
    it('should return connection status', () => {
      const connected = CacheService.isConnected();
      expect(typeof connected).toBe('boolean');
    });
  });
});
