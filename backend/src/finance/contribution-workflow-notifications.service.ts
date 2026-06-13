import { Injectable } from '@nestjs/common';

import { FamilyMemberRole, NotificationType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { NotificationsService } from '../notifications/notifications.service';

import { ContributionActionTokenService } from './contribution-action-token.service';

import { ContributionSmsChannel } from './contribution-sms.channel';



const DEDUPE_HOURS = 24;



@Injectable()

export class ContributionWorkflowNotificationsService {

  constructor(

    private prisma: PrismaService,

    private notifications: NotificationsService,

    private actionTokens: ContributionActionTokenService,

    private sms: ContributionSmsChannel,

  ) {}



  async evaluateFamilyDashboard(params: {

    familyId: string;

    choirId?: string | null;

    pendingCount: number;

    oldestPendingHours: number | null;

    oldestPendingContributionId?: string | null;

    behindCount: number;

  }): Promise<void> {

    const family = await this.prisma.family.findUnique({

      where: { id: params.familyId },

      select: { familyName: true, choirId: true, delegationEnabled: true },

    });

    if (!family) return;



    const choirId = params.choirId ?? family.choirId ?? undefined;



    if (

      params.pendingCount >= 3 &&

      params.oldestPendingHours != null &&

      params.oldestPendingHours >= 48

    ) {

      const approverIds = await this.loadApproverUserIds(

        params.familyId,

        family.delegationEnabled,

      );

      const title = 'Pending claims need attention';

      const body = `${params.pendingCount} contribution claims have been waiting over 48 hours for ${family.familyName}.`;



      for (const userId of approverIds) {

        const actionUrl = await this.buildApproveActionUrl({

          userId,

          contributionId: params.oldestPendingContributionId,

          choirId: choirId ?? family.choirId,

        });



        await this.notifyOnce({

          userId,

          choirId,

          kind: 'family_pending_aging',

          familyId: params.familyId,

          title,

          body,

          data: {

            pendingCount: params.pendingCount,

            oldestPendingHours: params.oldestPendingHours,

            contributionId: params.oldestPendingContributionId ?? undefined,

            actionUrl,

          },

        });

      }

    }



    if (params.behindCount >= 5) {

      const secretaryIds = await this.loadRoleUserIds(

        params.familyId,

        FamilyMemberRole.SECRETARY,

      );

      const title = 'Members need giving follow-up';

      const body = `${params.behindCount} members in ${family.familyName} are behind or have not contributed yet.`;



      for (const userId of secretaryIds) {

        await this.notifyOnce({

          userId,

          choirId,

          kind: 'family_giving_follow_up',

          familyId: params.familyId,

          title,

          body,

          data: { behindCount: params.behindCount },

        });

      }

    }

  }



  async notifyNewContributionForApproval(params: {

    familyId: string;

    contributionId: string;

    choirId?: string | null;

    delegationEnabled: boolean;

    submitterFirstName: string;

    recipientUserIds: string[];

    claimedAmount: number;

    currency: string;

    title?: string;

    body?: string;

  }): Promise<void> {

    const family = await this.prisma.family.findUnique({

      where: { id: params.familyId },

      select: { familyName: true, choirId: true },

    });

    if (!family) return;



    const choirId = params.choirId ?? family.choirId ?? undefined;

    const title = params.title ?? 'New contribution to review';

    const body =

      params.body ??

      `${params.submitterFirstName} submitted a contribution for ${family.familyName}.`;



    for (const userId of params.recipientUserIds) {

      const actionUrl = await this.buildApproveActionUrl({

        userId,

        contributionId: params.contributionId,

        choirId: choirId ?? family.choirId,

      });



      await this.notifications.create(

        userId,

        NotificationType.GENERAL,

        title,

        body,

        {

          kind: 'contribution_submitted',

          contributionId: params.contributionId,

          familyId: params.familyId,

          actionUrl,

        },

        choirId,

      );



      await this.sendApprovalReminderSms(userId, {

        memberName: params.submitterFirstName,

        amount: params.claimedAmount,

        currency: params.currency,

        actionUrl,

      });

    }

  }



  async notifyDelegationChanged(

    familyId: string,

    delegationEnabled: boolean,

    actorUserId: string,

  ): Promise<void> {

    const family = await this.prisma.family.findUnique({

      where: { id: familyId },

      select: { familyName: true, choirId: true },

    });

    if (!family) return;



    const deputyIds = await this.loadRoleUserIds(

      familyId,

      FamilyMemberRole.ASSISTANT_HEAD,

    );

    if (!deputyIds.length) return;



    const title = delegationEnabled

      ? 'Deputy approval enabled'

      : 'Deputy approval disabled';

    const body = delegationEnabled

      ? `You may now confirm contributions for ${family.familyName}.`

      : `Contribution confirmations for ${family.familyName} are handled by your family head again.`;



    for (const userId of deputyIds) {

      if (userId === actorUserId) continue;

      await this.notifyOnce({

        userId,

        choirId: family.choirId ?? undefined,

        kind: 'family_delegation_changed',

        familyId,

        title,

        body,

        data: { delegationEnabled },

        dedupeHours: 1,

      });

    }

  }



  private async buildApproveActionUrl(params: {

    userId: string;

    contributionId?: string | null;

    choirId?: string | null;

  }): Promise<string | undefined> {

    if (!params.contributionId || !params.choirId) return undefined;



    const token = this.actionTokens.createApproveToken({

      userId: params.userId,

      contributionId: params.contributionId,

      choirId: params.choirId,

    });

    return this.actionTokens.buildQuickActionUrl(params.choirId, token);

  }



  private async sendApprovalReminderSms(

    userId: string,

    payload: {

      memberName: string;

      amount: number;

      currency: string;

      actionUrl?: string;

    },

  ): Promise<void> {

    if (!payload.actionUrl) return;



    const user = await this.prisma.user.findUnique({

      where: { id: userId },

      select: {

        member: { select: { phone: true, firstName: true } },

      },

    });

    const phone = user?.member?.phone;

    if (!phone) return;



    void this.sms

      .sendApprovalReminder({

        phone,

        approverName: user?.member?.firstName ?? 'Approver',

        memberName: payload.memberName,

        amount: payload.amount,

        currency: payload.currency,

        actionUrl: payload.actionUrl,

      })

      .catch(() => undefined);

  }



  private async loadApproverUserIds(

    familyId: string,

    delegationEnabled: boolean,

  ): Promise<string[]> {

    const roles: FamilyMemberRole[] = [FamilyMemberRole.HEAD];

    if (delegationEnabled) {

      roles.push(FamilyMemberRole.ASSISTANT_HEAD);

    }

    return this.loadRoleUserIds(familyId, ...roles);

  }



  private async loadRoleUserIds(

    familyId: string,

    ...roles: FamilyMemberRole[]

  ): Promise<string[]> {

    const rows = await this.prisma.familyMember.findMany({

      where: { familyId, role: { in: roles } },

      include: { member: { select: { userId: true } } },

    });

    return [

      ...new Set(

        rows

          .map((row) => row.member.userId)

          .filter((id): id is string => Boolean(id)),

      ),

    ];

  }



  private async notifyOnce(params: {

    userId: string;

    choirId?: string;

    kind: string;

    familyId: string;

    title: string;

    body: string;

    data?: Record<string, unknown>;

    dedupeHours?: number;

  }): Promise<void> {

    const skip = await this.recentlyNotified(

      params.userId,

      params.kind,

      params.familyId,

      params.dedupeHours ?? DEDUPE_HOURS,

    );

    if (skip) return;



    await this.notifications.create(

      params.userId,

      NotificationType.GENERAL,

      params.title,

      params.body,

      {

        kind: params.kind,

        familyId: params.familyId,

        ...params.data,

      },

      params.choirId,

    );

  }



  private async recentlyNotified(

    userId: string,

    kind: string,

    familyId: string,

    hours: number,

  ): Promise<boolean> {

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const rows = await this.prisma.notification.findMany({

      where: { userId, createdAt: { gte: since } },

      select: { data: true },

      orderBy: { createdAt: 'desc' },

      take: 30,

    });



    return rows.some((row) => {

      const data = row.data as Record<string, unknown> | null;

      return data?.kind === kind && data?.familyId === familyId;

    });

  }

}

