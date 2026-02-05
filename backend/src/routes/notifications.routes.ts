/**
 * Push Notifications Routes
 *
 * Endpoints for device registration and notification preferences.
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { query } from '../config/database';
import { PushNotificationService } from '../services/PushNotificationService';
import { Logger } from '../services/LoggerService';

const router = Router();

/**
 * POST /api/notifications/register-device
 * Register device for push notifications
 */
router.post('/register-device', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { fcmToken, platform, osVersion, appVersion } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    const success = await PushNotificationService.registerDevice(
      req.userId!,
      fcmToken,
      { platform, osVersion, appVersion }
    );

    if (success) {
      res.json({ success: true, message: 'Device registered for notifications' });
    } else {
      res.status(500).json({ error: 'Failed to register device' });
    }
  } catch (error: any) {
    Logger.error('NOTIFICATIONS', 'Register device error', {}, error);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

/**
 * DELETE /api/notifications/unregister-device
 * Unregister device from push notifications
 */
router.delete('/unregister-device', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    await PushNotificationService.unregisterDevice(fcmToken);
    res.json({ success: true, message: 'Device unregistered' });
  } catch (error: any) {
    Logger.error('NOTIFICATIONS', 'Unregister device error', {}, error);
    res.status(500).json({ error: 'Failed to unregister device' });
  }
});

/**
 * GET /api/notifications/preferences
 * Get user's notification preferences
 */
router.get('/preferences', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT notification_preferences FROM users WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      preferences: result.rows[0].notification_preferences || {
        post_published: true,
        post_failed: true,
        scheduled_reminder: true,
        token_expiring: true,
        weekly_summary: true,
      },
    });
  } catch (error: any) {
    Logger.error('NOTIFICATIONS', 'Get preferences error', {}, error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

/**
 * PUT /api/notifications/preferences
 * Update user's notification preferences
 */
router.put('/preferences', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Preferences object is required' });
    }

    // Validate preference keys
    const validKeys = ['post_published', 'post_failed', 'scheduled_reminder', 'token_expiring', 'weekly_summary'];
    const sanitizedPrefs: Record<string, boolean> = {};

    for (const key of validKeys) {
      if (typeof preferences[key] === 'boolean') {
        sanitizedPrefs[key] = preferences[key];
      }
    }

    await query(
      `UPDATE users
       SET notification_preferences = notification_preferences || $1::jsonb
       WHERE id = $2`,
      [JSON.stringify(sanitizedPrefs), req.userId]
    );

    res.json({ success: true, preferences: sanitizedPrefs });
  } catch (error: any) {
    Logger.error('NOTIFICATIONS', 'Update preferences error', {}, error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

/**
 * GET /api/notifications/status
 * Get push notification service status
 */
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Count user's registered devices
    const deviceResult = await query(
      `SELECT COUNT(*) as count FROM user_devices WHERE user_id = $1`,
      [req.userId]
    );

    res.json({
      enabled: PushNotificationService.isEnabled(),
      devicesRegistered: parseInt(deviceResult.rows[0].count, 10),
    });
  } catch (error: any) {
    Logger.error('NOTIFICATIONS', 'Status error', {}, error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

/**
 * POST /api/notifications/test
 * Send a test notification (development only)
 */
router.post('/test', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Test notifications disabled in production' });
    }

    const result = await PushNotificationService.sendToUser(
      req.userId!,
      'post_published',
      {
        title: 'Test Notification',
        body: 'This is a test notification from Kuil!',
        data: { action: 'test' },
      }
    );

    res.json({
      success: result.success,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error: any) {
    Logger.error('NOTIFICATIONS', 'Test notification error', {}, error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

export default router;
