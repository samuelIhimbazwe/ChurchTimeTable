import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private initialized = false;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.init();
  }

  private init() {
    const projectId = this.config.get<string>('FCM_PROJECT_ID');
    if (!projectId || admin.apps.length) return;

    try {
      admin.initializeApp({
        projectId,
        credential: admin.credential.applicationDefault(),
      });
      this.initialized = true;
    } catch {
      const key = this.config.get<string>('FCM_SERVER_KEY');
      if (key) {
        this.logger.warn('FCM using legacy server key mode (set FCM_PROJECT_ID for Admin SDK)');
      }
    }
  }

  async sendToToken(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    userId?: string,
  ) {
    if (!token) return;

    const clearToken = async () => {
      if (!userId) return;
      await this.prisma.user.updateMany({
        where: { id: userId, fcmToken: token },
        data: { fcmToken: null },
      });
    };

    if (this.initialized && admin.apps.length) {
      try {
        await admin.messaging().send({
          token,
          notification: { title, body },
          data,
        });
        return;
      } catch (err) {
        const msg = String(err);
        if (
          msg.includes('registration-token-not-registered') ||
          msg.includes('invalid-registration-token')
        ) {
          await clearToken();
        }
        this.logger.warn(`FCM send failed: ${err}`);
      }
    }

    const serverKey = this.config.get<string>('FCM_SERVER_KEY');
    if (!serverKey) {
      this.logger.debug(`FCM skipped (no credentials): ${title}`);
      return;
    }

    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        Authorization: `key=${serverKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        notification: { title, body },
        data,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (text.includes('NotRegistered') || text.includes('InvalidRegistration')) {
        await clearToken();
      }
    }
  }
}
