import { Injectable } from '@nestjs/common';
import {
  NotificationDeliveryStatus,
  NotificationRuleTrigger,
  NotificationType,
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export type DeliverParams = {
  recipientUserId: string;
  trigger: NotificationRuleTrigger;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  dedupeKey?: string;
  metadata?: Record<string, unknown>;
  choirId?: string;
  ministryId?: string;
};

@Injectable()
export class NotificationDeliveryService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async alreadyDelivered(dedupeKey: string): Promise<boolean> {
    const existing = await this.prisma.notificationDeliveryLog.findUnique({
      where: { dedupeKey },
    });
    return existing?.status === 'SENT' || existing?.status === 'PENDING';
  }

  async deliver(params: DeliverParams) {
    if (params.dedupeKey && (await this.alreadyDelivered(params.dedupeKey))) {
      return null;
    }

    const log = await this.prisma.notificationDeliveryLog.create({
      data: {
        recipientUserId: params.recipientUserId,
        trigger: params.trigger,
        title: params.title,
        body: params.body,
        status: 'PENDING',
        dedupeKey: params.dedupeKey,
        metadata: (params.metadata ?? params.data) as Prisma.InputJsonValue | undefined,
      },
    });

    try {
      const notification = await this.notifications.create(
        params.recipientUserId,
        params.type,
        params.title,
        params.body,
        params.data,
        params.choirId,
        params.ministryId,
      );
      return this.prisma.notificationDeliveryLog.update({
        where: { id: log.id },
        data: {
          notificationId: notification.id,
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (err) {
      await this.prisma.notificationDeliveryLog.update({
        where: { id: log.id },
        data: {
          status: 'FAILED',
          failureReason: err instanceof Error ? err.message : 'Delivery failed',
        },
      });
      return null;
    }
  }

  async markRead(notificationId: string, userId: string) {
    await this.prisma.notificationDeliveryLog.updateMany({
      where: { notificationId, recipientUserId: userId, status: 'SENT' },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  async listDeliveryLogs(options?: { limit?: number; status?: NotificationDeliveryStatus }) {
    return this.prisma.notificationDeliveryLog.findMany({
      where: options?.status ? { status: options.status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 100,
      include: {
        recipient: { select: { email: true } },
      },
    });
  }
}
