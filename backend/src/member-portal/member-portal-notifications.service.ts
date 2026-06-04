import { Injectable } from '@nestjs/common';
import { NotificationRuleTrigger, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationRuleGateService } from '../pilot-ready/notification-rule-gate.service';

@Injectable()
export class MemberPortalNotificationsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private ruleGate: NotificationRuleGateService,
  ) {}

  private async notifyUser(
    userId: string,
    title: string,
    body: string,
    data: Record<string, unknown>,
  ) {
    try {
      await this.notifications.create(
        userId,
        NotificationType.GENERAL,
        title,
        body,
        data,
      );
    } catch {
      /* best-effort */
    }
  }

  async notifyJoinRequestReviewed(request: {
    member: { userId: string };
    choir: { name: string };
    status: string;
  }) {
    const trigger =
      request.status === 'APPROVED'
        ? NotificationRuleTrigger.REQUEST_APPROVED
        : request.status === 'REJECTED'
          ? NotificationRuleTrigger.REQUEST_REJECTED
          : null;
    if (trigger && !(await this.ruleGate.allows(trigger))) {
      return;
    }
    const title =
      request.status === 'APPROVED'
        ? 'Choir request approved'
        : request.status === 'REJECTED'
          ? 'Choir request declined'
          : 'Choir request needs information';
    await this.notifyUser(
      request.member.userId,
      title,
      `${request.choir.name}: ${request.status}`,
      { kind: 'choir_join_review', status: request.status },
    );
  }

  async notifyProtocolInvitation(invitation: {
    id: string;
    member: { userId: string };
  }) {
    if (!(await this.ruleGate.allows(NotificationRuleTrigger.INVITATION_RECEIVED))) {
      return;
    }
    await this.notifyUser(
      invitation.member.userId,
      'Protocol invitation',
      'You have been invited to join the protocol team',
      { kind: 'protocol_invitation', invitationId: invitation.id },
    );
  }

  async notifyProtocolClaimReviewed(claim: {
    member: { userId: string };
    status: string;
  }) {
    const trigger =
      claim.status === 'APPROVED'
        ? NotificationRuleTrigger.REQUEST_APPROVED
        : claim.status === 'REJECTED'
          ? NotificationRuleTrigger.REQUEST_REJECTED
          : null;
    if (trigger && !(await this.ruleGate.allows(trigger))) {
      return;
    }
    await this.notifyUser(
      claim.member.userId,
      'Protocol membership claim',
      `Your claim was ${claim.status}`,
      { kind: 'protocol_claim_review', status: claim.status },
    );
  }

  async notifyBroadcastStarted(broadcast: {
    id: string;
    title: string;
    isLive: boolean;
  }) {
    if (!(await this.ruleGate.allows(NotificationRuleTrigger.SCHEDULE_CHANGE))) {
      return;
    }
    const members = await this.prisma.member.findMany({
      where: { status: 'ACTIVE' },
      select: { userId: true },
      take: 500,
    });
    const body = broadcast.isLive ? 'Live now' : 'New broadcast published';
    for (const m of members) {
      if (!m.userId) continue;
      await this.notifyUser(m.userId, broadcast.title, body, {
        kind: 'church_broadcast',
        broadcastId: broadcast.id,
      });
    }
  }
}
