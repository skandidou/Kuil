/**
 * AuthService Unit Tests
 */

import { AuthService } from '../../services/AuthService';

describe('AuthService', () => {
  describe('generateJWT', () => {
    it('should generate a valid JWT token', () => {
      const userId = 'test-user-id-123';
      const token = AuthService.generateJWT(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different users', () => {
      const token1 = AuthService.generateJWT('user-1');
      const token2 = AuthService.generateJWT('user-2');

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyJWT', () => {
    it('should verify a valid token and return userId', () => {
      const userId = 'test-user-id-456';
      const token = AuthService.generateJWT(userId);
      const decoded = AuthService.verifyJWT(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(userId);
    });

    it('should return null for an invalid token', () => {
      const decoded = AuthService.verifyJWT('invalid-token');

      expect(decoded).toBeNull();
    });

    it('should return null for a tampered token', () => {
      const token = AuthService.generateJWT('user-id');
      const tamperedToken = token.slice(0, -5) + 'XXXXX';
      const decoded = AuthService.verifyJWT(tamperedToken);

      expect(decoded).toBeNull();
    });

    it('should return null for an empty token', () => {
      const decoded = AuthService.verifyJWT('');

      expect(decoded).toBeNull();
    });
  });

  describe('encryptToken / decryptToken', () => {
    it('should encrypt and decrypt a token correctly', () => {
      const originalToken = 'linkedin-access-token-abc123';
      const encrypted = AuthService.encryptToken(originalToken);
      const decrypted = AuthService.decryptToken(encrypted);

      expect(encrypted).not.toBe(originalToken);
      expect(decrypted).toBe(originalToken);
    });

    it('should produce different ciphertext for same plaintext (due to IV)', () => {
      const token = 'same-token';
      const encrypted1 = AuthService.encryptToken(token);
      const encrypted2 = AuthService.encryptToken(token);

      // CryptoJS AES uses random IV, so same plaintext produces different ciphertext
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to the same value
      expect(AuthService.decryptToken(encrypted1)).toBe(token);
      expect(AuthService.decryptToken(encrypted2)).toBe(token);
    });

    it('should handle special characters in token', () => {
      const specialToken = 'token+with/special=chars&symbols!@#$%';
      const encrypted = AuthService.encryptToken(specialToken);
      const decrypted = AuthService.decryptToken(encrypted);

      expect(decrypted).toBe(specialToken);
    });

    it('should handle long tokens', () => {
      const longToken = 'a'.repeat(1000);
      const encrypted = AuthService.encryptToken(longToken);
      const decrypted = AuthService.decryptToken(encrypted);

      expect(decrypted).toBe(longToken);
    });
  });

  describe('generateState', () => {
    it('should generate a random state string', () => {
      const state = AuthService.generateState();

      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);
    });

    it('should generate unique states each time', () => {
      const states = new Set<string>();
      for (let i = 0; i < 100; i++) {
        states.add(AuthService.generateState());
      }

      // All 100 should be unique
      expect(states.size).toBe(100);
    });
  });
});
