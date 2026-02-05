/**
 * Push Notification Service
 *
 * Handles sending push notifications via Firebase Cloud Messaging (FCM).
 * Supports iOS (APNs via FCM) notifications.
 *
 * Setup required:
 * 1. Create Firebase project at console.firebase.google.com
 * 2. Download service account key JSON
 * 3. Set FIREBASE_SERVICE_ACCOUNT env variable (base64 encoded JSON)
 * 4. Enable Cloud Messaging in Firebase console
 * 5. Configure APNs in Firebase for iOS
 */

import * as admin from 'firebase-admin';
import { Logger } from './LoggerService';
import { query } from '../config/database';

// Notification types
export type NotificationType =
  | 'post_published'
  | 'post_failed'
  | 'post_scheduled_reminder'
  | 'linkedin_token_expiring'
  | 'weekly_summary';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
}

class PushNotificationServiceClass {
  private initialized = false;
  private initializationAttempted = false;

  /**
   * Initialize Firebase Admin SDK
   */
  async initialize(): Promise<boolean> {
    if (this.initializationAttempted) return this.initialized;
    this.initializationAttempted = true;

    try {
      const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT;

      if (!serviceAccountBase64) {
        Logger.warn('PUSH', 'FIREBASE_SERVICE_ACCOUNT not configured - push notifications disabled');
        return false;
      }

      // Decode base64 service account
      const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(serviceAccountJson);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      this.initialized = true;
      Logger.info('PUSH', 'Firebase Admin SDK initialized successfully');
      return true;
    } catch (error: any) {
      Logger.error('PUSH', 'Failed to initialize Firebase', {}, error);
      return false;
    }
  }

  /**
   * Register device token for a user
   */
  async registerDevice(userId: string, fcmToken: string, deviceInfo?: {
    platform?: string;
    osVersion?: string;
    appVersion?: string;
  }): Promise<boolean> {
    try {
      // Upsert device token
      await query(
        `INSERT INTO user_devices (user_id, fcm_token, platform, os_version, app_version, last_active_at, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (fcm_token)
         DO UPDATE SET
           user_id = $1,
           platform = COALESCE($3, user_devices.platform),
           os_version = COALESCE($4, user_devices.os_version),
           app_version = COALESCE($5, user_devices.app_version),
           last_active_at = NOW()`,
        [
          userId,
          fcmToken,
          deviceInfo?.platform || 'ios',
          deviceInfo?.osVersion,
          deviceInfo?.appVersion,
        ]
      );

      Logger.info('PUSH', `Device registered for user ${userId.substring(0, 8)}`);
      return true;
    } catch (error: any) {
      Logger.error('PUSH', 'Failed to register device', { userId }, error);
      return false;
    }
  }

  /**
   * Unregister device token
   */
  async unregisterDevice(fcmToken: string): Promise<boolean> {
    try {
      await query(`DELETE FROM user_devices WHERE fcm_token = $1`, [fcmToken]);
      Logger.info('PUSH', 'Device unregistered');
      return true;
    } catch (error: any) {
      Logger.error('PUSH', 'Failed to unregister device', {}, error);
      return false;
    }
  }

  /**
   * Send notification to a specific user
   */
  async sendToUser(
    userId: string,
    type: NotificationType,
    payload: NotificationPayload
  ): Promise<{ success: boolean; sent: number; failed: number }> {
    if (!this.initialized) {
      Logger.warn('PUSH', 'Push notifications not initialized');
      return { success: false, sent: 0, failed: 0 };
    }

    try {
      // Get user's device tokens
      const result = await query(
        `SELECT fcm_token FROM user_devices WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        Logger.debug('PUSH', `No devices registered for user ${userId.substring(0, 8)}`);
        return { success: true, sent: 0, failed: 0 };
      }

      const tokens = result.rows.map((r) => r.fcm_token);
      return await this.sendToTokens(tokens, type, payload);
    } catch (error: any) {
      Logger.error('PUSH', 'Failed to send notification to user', { userId }, error);
      return { success: false, sent: 0, failed: 0 };
    }
  }

  /**
   * Send notification to multiple tokens
   */
  async sendToTokens(
    tokens: string[],
    type: NotificationType,
    payload: NotificationPayload
  ): Promise<{ success: boolean; sent: number; failed: number }> {
    if (!this.initialized || tokens.length === 0) {
      return { success: false, sent: 0, failed: 0 };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          type,
          ...payload.data,
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              badge: payload.badge ?? 1,
              sound: payload.sound ?? 'default',
              'content-available': 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // Handle failed tokens (remove invalid ones)
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            // Remove invalid/unregistered tokens
            if (
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered'
            ) {
              failedTokens.push(tokens[idx]);
            }
          }
        });

        // Clean up invalid tokens
        if (failedTokens.length > 0) {
          await this.removeInvalidTokens(failedTokens);
        }
      }

      Logger.info('PUSH', `Notification sent: ${response.successCount} success, ${response.failureCount} failed`, {
        type,
        title: payload.title,
      });

      return {
        success: true,
        sent: response.successCount,
        failed: response.failureCount,
      };
    } catch (error: any) {
      Logger.error('PUSH', 'Failed to send notifications', { type }, error);
      return { success: false, sent: 0, failed: tokens.length };
    }
  }

  /**
   * Remove invalid tokens from database
   */
  private async removeInvalidTokens(tokens: string[]): Promise<void> {
    try {
      await query(
        `DELETE FROM user_devices WHERE fcm_token = ANY($1)`,
        [tokens]
      );
      Logger.info('PUSH', `Removed ${tokens.length} invalid device tokens`);
    } catch (error: any) {
      Logger.error('PUSH', 'Failed to remove invalid tokens', {}, error);
    }
  }

  // ===========================
  // NOTIFICATION TEMPLATES
  // ===========================

  /**
   * Notify when a scheduled post is published
   */
  async notifyPostPublished(userId: string, postPreview: string): Promise<void> {
    await this.sendToUser(userId, 'post_published', {
      title: 'Post Published! 🎉',
      body: postPreview.substring(0, 100) + (postPreview.length > 100 ? '...' : ''),
      data: { action: 'view_post' },
    });
  }

  /**
   * Notify when a scheduled post fails
   */
  async notifyPostFailed(userId: string, reason: string): Promise<void> {
    await this.sendToUser(userId, 'post_failed', {
      title: 'Post Failed to Publish',
      body: `Your scheduled post couldn't be published: ${reason.substring(0, 80)}`,
      data: { action: 'retry_post' },
    });
  }

  /**
   * Remind user about upcoming scheduled post
   */
  async notifyScheduledReminder(userId: string, minutesUntil: number): Promise<void> {
    await this.sendToUser(userId, 'post_scheduled_reminder', {
      title: 'Scheduled Post Coming Up',
      body: `Your post will be published in ${minutesUntil} minutes`,
      data: { action: 'view_scheduled' },
    });
  }

  /**
   * Notify about LinkedIn token expiring soon
   */
  async notifyTokenExpiring(userId: string, daysUntil: number): Promise<void> {
    await this.sendToUser(userId, 'linkedin_token_expiring', {
      title: 'LinkedIn Connection Expiring',
      body: `Your LinkedIn connection will expire in ${daysUntil} days. Reconnect to keep publishing.`,
      data: { action: 'reconnect_linkedin' },
    });
  }

  /**
   * Send weekly summary notification
   */
  async notifyWeeklySummary(userId: string, stats: {
    postsPublished: number;
    totalImpressions: number;
  }): Promise<void> {
    await this.sendToUser(userId, 'weekly_summary', {
      title: 'Your Weekly Summary 📊',
      body: `You published ${stats.postsPublished} posts with ${stats.totalImpressions} impressions this week!`,
      data: { action: 'view_analytics' },
    });
  }

  /**
   * Check if push notifications are enabled
   */
  isEnabled(): boolean {
    return this.initialized;
  }
}

// Singleton
export const PushNotificationService = new PushNotificationServiceClass();
