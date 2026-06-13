import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { AppLinkService } from './app-link.service';
import {
  WhatsAppOutboundService,
  type WhatsAppSendResult,
} from './whatsapp-outbound.service';

const JOIN_REVIEW_PERMISSIONS = [
  PERMISSIONS.CHOIR_JOIN_REVIEW,
  PERMISSIONS.CHOIR_OPERATIONS_MANAGE,
  PERMISSIONS.MEMBER_MANAGE,
] as const;

@Injectable()
export class IndividualWhatsAppService {
  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsAppOutboundService,
    private links: AppLinkService,
  ) {}

  async sendThankYou(params: {
    phone: string;
    memberName: string;
    amount: number;
    currency: string;
    referenceNumber: string;
  }): Promise<WhatsAppSendResult> {
    const link = this.links.portalContributions();
    const body = [
      `Murakoze ${params.memberName}!`,
      `Twakiriye ${params.amount} ${params.currency} (${params.referenceNumber}).`,
      `Reba mu app: ${link}`,
    ].join('\n');

    return this.whatsapp.send({
      phone: params.phone,
      body,
      templateName: process.env.WHATSAPP_TEMPLATE_THANK_YOU,
    });
  }

  async sendAnnouncement(params: {
    userId: string;
    title: string;
    preview: string;
    choirId: string;
    announcementId: string;
  }): Promise<WhatsAppSendResult> {
    const link = this.links.choirAnnouncement(
      params.choirId,
      params.announcementId,
    );
    const body = [
      params.title,
      params.preview,
      `Soma byose: ${link}`,
    ].join('\n\n');

    return this.sendToUser(params.userId, body, {
      phoneFallback: undefined,
      templateName: process.env.WHATSAPP_TEMPLATE_ANNOUNCEMENT,
    });
  }

  async sendVerseOfDay(params: {
    userId: string;
    title: string;
    verseReference?: string | null;
    verseText?: string | null;
    choirId: string;
    devotionId: string;
  }): Promise<WhatsAppSendResult> {
    const link = this.links.portalDevotion();
    const verseLine =
      params.verseReference && params.verseText
        ? `${params.verseReference} — ${params.verseText}`
        : params.verseText ?? params.title;

    const body = [
      'Verse of the day',
      verseLine,
      `Soma mu app: ${link}`,
    ].join('\n\n');

    return this.sendToUser(params.userId, body, {
      templateName: process.env.WHATSAPP_TEMPLATE_VERSE,
    });
  }

  async notifyJoinRequestSubmitted(params: {
    choirId: string;
    choirName: string;
    requestId: string;
    memberName: string;
    requestType?: string;
  }): Promise<WhatsAppSendResult[]> {
    const reviewers = await this.loadJoinReviewers();
    const link = this.links.choirJoinRequests(params.choirId, params.requestId);
    const body = [
      'New choir join request',
      `${params.memberName} requested to join ${params.choirName}.`,
      params.requestType ? `Type: ${params.requestType}` : null,
      `Review: ${link}`,
    ]
      .filter(Boolean)
      .join('\n');

    const results: WhatsAppSendResult[] = [];
    for (const reviewer of reviewers) {
      if (!reviewer.phone) {
        results.push({ sent: false, skippedReason: 'no_phone' });
        continue;
      }
      results.push(
        await this.whatsapp.send({
          phone: reviewer.phone,
          body,
          templateName: process.env.WHATSAPP_TEMPLATE_JOIN_REQUEST,
        }),
      );
    }
    return results;
  }

  loadJoinReviewers(): Promise<
    Array<{ userId: string; phone: string | null; firstName: string | null }>
  > {
    return this.loadUsersWithAnyPermission([...JOIN_REVIEW_PERMISSIONS]);
  }

  private async sendToUser(
    userId: string,
    body: string,
    options?: { templateName?: string; phoneFallback?: string },
  ): Promise<WhatsAppSendResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        member: { select: { phone: true } },
      },
    });

    const phone = user?.member?.phone?.trim() ?? options?.phoneFallback;
    if (!phone) {
      return { sent: false, skippedReason: 'no_phone' };
    }

    return this.whatsapp.send({
      phone,
      body,
      templateName: options?.templateName,
    });
  }

  private async loadUsersWithAnyPermission(permissions: string[]) {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        member: { select: { phone: true, firstName: true } },
        userRoles: {
          select: {
            role: {
              select: {
                rolePermissions: {
                  select: { permission: { select: { code: true } } },
                },
              },
            },
          },
        },
      },
    });

    return users
      .filter((user) => {
        const codes = user.userRoles.flatMap((row) =>
          row.role.rolePermissions.map((rp) => rp.permission.code),
        );
        return permissions.some((perm) => hasEffectivePermission(codes, perm));
      })
      .map((user) => ({
        userId: user.id,
        phone: user.member?.phone?.trim() ?? null,
        firstName: user.member?.firstName ?? null,
      }));
  }
}
