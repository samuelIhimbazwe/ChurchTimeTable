import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  NotificationRuleTrigger,
  NotificationType,
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { NotificationDeliveryService } from '../pilot-ready/notification-delivery.service';
import { WhatsAppOutboundService } from '../messaging/whatsapp-outbound.service';
import { hasProtocolManage, hasProtocolView } from './protocol-access.util';

export type ProtocolCommChannel = 'IN_APP' | 'SMS' | 'WHATSAPP';

const TEMPLATES = [
  {
    id: 'assignment_reminder',
    label: 'Assignment reminder',
    title: 'Protocol service assignment',
    body: 'You are assigned to serve on the upcoming protocol team. Open the app for details.',
  },
  {
    id: 'replacement_notice',
    label: 'Replacement notice',
    title: 'Protocol replacement',
    body: 'A replacement request needs your attention. Please review in the protocol module.',
  },
  {
    id: 'claim_invitation',
    label: 'Claim / invitation link',
    title: 'Protocol membership',
    body: 'You have a pending protocol invitation or claim. Open the member portal to respond.',
  },
  {
    id: 'general_announcement',
    label: 'General announcement',
    title: 'Protocol announcement',
    body: 'Message from protocol leadership.',
  },
] as const;

@Injectable()
export class ProtocolCommunicationsService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
    private delivery: NotificationDeliveryService,
    private whatsapp: WhatsAppOutboundService,
  ) {}

  private async assertOfficer(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      !hasProtocolManage(resolved.permissions) &&
      !resolved.permissions.some((p) =>
        ['protocol.oversight', 'protocol.team.manage', 'protocol.secretary'].includes(p),
      )
    ) {
      throw new ForbiddenException('Communications access denied');
    }
    return resolved;
  }

  listTemplates() {
    return TEMPLATES.map((t) => ({
      id: t.id,
      label: t.label,
      title: t.title,
      body: t.body,
    }));
  }

  async listLogs(
    actorUserId: string,
    options?: { status?: string; limit?: number },
  ) {
    await this.assertOfficer(actorUserId);
    const limit = options?.limit ?? 50;
    const rows = await this.prisma.notificationDeliveryLog.findMany({
      where: {
        trigger: NotificationRuleTrigger.PROTOCOL_ASSIGNMENT,
        ...(options?.status
          ? { status: options.status as never }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit * 4,
      include: {
        recipient: {
          select: {
            email: true,
            member: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    const manualRows = rows
      .filter((row) => {
        const meta = row.metadata as Record<string, unknown> | null;
        return meta?.protocolManual === true;
      })
      .slice(0, limit);

    return manualRows.map((row) => {
      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      const member = row.recipient.member;
      const recipientName = member
        ? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim()
        : row.recipient.email;
      return {
        id: row.id,
        channel: String(meta.channel ?? 'IN_APP'),
        title: row.title,
        body: row.body,
        status: row.status,
        recipientName: recipientName || 'Member',
        sentAt: row.sentAt,
        failureReason: row.failureReason,
        createdAt: row.createdAt,
        templateId: meta.templateId ? String(meta.templateId) : null,
      };
    });
  }

  async send(
    actorUserId: string,
    body: {
      memberIds: string[];
      channel: ProtocolCommChannel;
      title: string;
      message: string;
      templateId?: string;
    },
  ) {
    await this.assertOfficer(actorUserId);
    if (!body.memberIds?.length) {
      throw new BadRequestException('Select at least one recipient');
    }
    if (!body.title?.trim() || !body.message?.trim()) {
      throw new BadRequestException('Title and message are required');
    }

    const members = await this.prisma.member.findMany({
      where: { id: { in: body.memberIds } },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    const results: Array<{
      memberId: string;
      channel: ProtocolCommChannel;
      status: 'SENT' | 'FAILED' | 'SKIPPED';
      detail?: string;
    }> = [];

    for (const member of members) {
      if (!member.userId) {
        results.push({
          memberId: member.id,
          channel: body.channel,
          status: 'SKIPPED',
          detail: 'no_user_account',
        });
        continue;
      }

      const metadata = {
        protocolManual: true,
        channel: body.channel,
        templateId: body.templateId ?? null,
        sentByUserId: actorUserId,
      } as Prisma.InputJsonValue;

      if (body.channel === 'IN_APP') {
        const log = await this.delivery.deliver({
          recipientUserId: member.userId,
          trigger: NotificationRuleTrigger.PROTOCOL_ASSIGNMENT,
          type: NotificationType.GENERAL,
          title: body.title.trim(),
          body: body.message.trim(),
          data: { kind: 'protocol_communication', channel: 'IN_APP' },
          metadata: metadata as Record<string, unknown>,
        });
        results.push({
          memberId: member.id,
          channel: body.channel,
          status: log?.status === 'SENT' ? 'SENT' : 'FAILED',
        });
        continue;
      }

      const phone = member.phone?.trim();
      if (!phone) {
        const failed = await this.prisma.notificationDeliveryLog.create({
          data: {
            recipientUserId: member.userId,
            trigger: NotificationRuleTrigger.PROTOCOL_ASSIGNMENT,
            title: body.title.trim(),
            body: body.message.trim(),
            status: 'FAILED',
            failureReason: 'missing_phone',
            metadata,
          },
        });
        void failed;
        results.push({
          memberId: member.id,
          channel: body.channel,
          status: 'FAILED',
          detail: 'missing_phone',
        });
        continue;
      }

      let externalStatus: 'SENT' | 'FAILED' | 'SKIPPED' = 'FAILED';
      let failureReason: string | undefined;

      if (body.channel === 'WHATSAPP') {
        const wa = await this.whatsapp.send({ phone, body: body.message.trim() });
        externalStatus = wa.sent ? 'SENT' : 'SKIPPED';
        failureReason = wa.skippedReason;
      } else {
        externalStatus =
          process.env.SMS_ENABLED === 'true' ? 'SKIPPED' : 'SKIPPED';
        failureReason = 'sms_provider_not_configured';
      }

      await this.prisma.notificationDeliveryLog.create({
        data: {
          recipientUserId: member.userId,
          trigger: NotificationRuleTrigger.PROTOCOL_ASSIGNMENT,
          title: body.title.trim(),
          body: body.message.trim(),
          status: externalStatus === 'SENT' ? 'SENT' : 'FAILED',
          sentAt: externalStatus === 'SENT' ? new Date() : undefined,
          failureReason,
          metadata,
        },
      });

      await this.delivery.deliver({
        recipientUserId: member.userId,
        trigger: NotificationRuleTrigger.PROTOCOL_ASSIGNMENT,
        type: NotificationType.GENERAL,
        title: body.title.trim(),
        body: body.message.trim(),
        data: { kind: 'protocol_communication', channel: body.channel },
        metadata: metadata as Record<string, unknown>,
      });

      results.push({
        memberId: member.id,
        channel: body.channel,
        status: externalStatus,
        detail: failureReason,
      });
    }

    return { sent: results.filter((r) => r.status === 'SENT').length, results };
  }
}
