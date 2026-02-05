import jwt, { Secret } from 'jsonwebtoken';
import CryptoJS from 'crypto-js';
import { config } from '../config/env';

export class AuthService {
  /**
   * Generate JWT token for iOS app
   */
  static generateJWT(userId: string): string {
    const payload = {
      userId,
      iat: Math.floor(Date.now() / 1000),
    };

    // @ts-ignore - TypeScript has issues with jwt.sign overloads
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  /**
   * Verify and decode JWT token
   */
  static verifyJWT(token: string): { userId: string } | null {
    try {
      // @ts-ignore - TypeScript has issues with jwt.verify overloads
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      console.log(`✅ [JWT] Token valid - User: ${decoded.userId}, Expires: ${new Date(decoded.exp * 1000).toISOString()}`);

      return { userId: decoded.userId };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        console.error(`❌ [JWT] Token expired at: ${error.expiredAt}`);
      } else if (error.name === 'JsonWebTokenError') {
        console.error(`❌ [JWT] Invalid token: ${error.message}`);
      } else {
        console.error('❌ [JWT] Verification failed:', error);
      }
      return null;
    }
  }

  /**
   * Encrypt LinkedIn access token before storing in database
   */
  static encryptToken(token: string): string {
    return CryptoJS.AES.encrypt(token, config.encryption.key).toString();
  }

  /**
   * Decrypt LinkedIn access token from database
   */
  static decryptToken(encryptedToken: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, config.encryption.key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Generate random state parameter for OAuth (CSRF protection)
   */
  static generateState(): string {
    return CryptoJS.lib.WordArray.random(16).toString();
  }
}
