import { Injectable, NotFoundException } from '@nestjs/common';
import { ContributionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ContributionScopeService } from './contribution-scope.service';

export type ContributionTimelineEventType =
  | 'submitted'
  | 'family_approved'
  | 'approved'
  | 'rejected'
  | 'treasury_returned'
  | 'adjusted'
  | 'family_changed'
  | 'type_changed'
  | 'campaign_changed'
  | 'thank_you_sent'
  | 'ledger_posted';

export interface ContributionTimelineEvent {
  type: ContributionTimelineEventType;
  timestamp: string;
  actorId?: string | null;
  actorRole?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
}

const CONTRIBUTION_AUDIT_ACTIONS = [
  'CONTRIBUTION_SUBMITTED',
  'CONTRIBUTION_FAMILY_APPROVED',
  'CONTRIBUTION_CONFIRMED',
  'CONTRIBUTION_REJECTED',
  'CONTRIBUTION_TREASURY_RETURNED',
  'CONTRIBUTION_ADJUST',
  'CONTRIBUTION_FAMILY_CHANGE',
  'CONTRIBUTION_TYPE_CHANGE',
  'CONTRIBUTION_CAMPAIGN_CHANGE',
  'CONTRIBUTION_THANK_YOU_SENT',
  'FINANCE_TRANSACTION_CREATE',
] as const;

@Injectable()
export class ContributionTimelineService {
  constructor(
    private prisma: PrismaService,
    private scope: ContributionScopeService,
  ) {}

  async getTimeline(actorUserId: string, contributionId: string) {
    const ctx = await this.scope.resolveActor(actorUserId);
    const record = await this.prisma.contributionRecord.findUnique({
      where: { id: contributionId },
      select: {
        id: true,
        memberId: true,
        familyId: true,
        status: true,
        referenceNumber: true,
        createdAt: true,
        familyApprovedAt: true,
        familyRejectedAt: true,
        confirmedAt: true,
        thankYouSentAt: true,
        financeTransactionId: true,
        discrepancyReason: true,
        discrepancyAmount: true,
      },
    });
    if (!record) {
      throw new NotFoundException('Contribution not found');
    }

    this.assertCanViewTimeline(ctx, record);

    const events: ContributionTimelineEvent[] = [];

    const adjustments = await this.prisma.contributionAdjustment.findMany({
      where: { contributionRecordId: contributionId },
      select: { id: true },
    });
    const adjustmentIds = adjustments.map((row) => row.id);
    const auditOr: Array<{
      entity: string;
      entityId: string;
    }> = [{ entity: 'ContributionRecord', entityId: contributionId }];
    for (const adjustmentId of adjustmentIds) {
      auditOr.push({ entity: 'ContributionAdjustment', entityId: adjustmentId });
    }
    if (record.financeTransactionId) {
      auditOr.push({
        entity: 'FinanceTransaction',
        entityId: record.financeTransactionId,
      });
    }

    const audits = await this.prisma.auditLog.findMany({
      where: {
        OR: auditOr,
        action: { in: [...CONTRIBUTION_AUDIT_ACTIONS] },
      },
      orderBy: { createdAt: 'asc' },
    });

    for (const row of audits) {
      const mapped = this.mapAuditToEvent(row.action, row.createdAt, row.newValue);
      if (mapped) events.push({ ...mapped, actorId: this.extractActor(row.newValue) });
    }

    if (!events.some((e) => e.type === 'submitted')) {
      events.push({
        type: 'submitted',
        timestamp: record.createdAt.toISOString(),
        summary: 'Contribution submitted',
        metadata: { referenceNumber: record.referenceNumber },
      });
    }

    if (
      record.familyApprovedAt &&
      !events.some((e) => e.type === 'family_approved' || e.type === 'approved')
    ) {
      const awaitingTreasury =
        record.status === ContributionStatus.SUBMITTED && !record.confirmedAt;
      events.push({
        type: awaitingTreasury ? 'family_approved' : 'approved',
        timestamp: record.familyApprovedAt.toISOString(),
        summary: awaitingTreasury
          ? 'Family head confirmed payment — awaiting treasurer'
          : 'Contribution confirmed by family',
      });
    }

    if (
      record.status === ContributionStatus.REJECTED &&
      record.familyRejectedAt &&
      !events.some((e) => e.type === 'rejected')
    ) {
      events.push({
        type: 'rejected',
        timestamp: record.familyRejectedAt.toISOString(),
        summary: 'Contribution rejected by family',
      });
    }

    const isMemberOwnView = this.isMemberOwnView(ctx, record);

    if (
      !isMemberOwnView &&
      record.thankYouSentAt &&
      !events.some((e) => e.type === 'thank_you_sent')
    ) {
      events.push({
        type: 'thank_you_sent',
        timestamp: record.thankYouSentAt.toISOString(),
        summary: 'Thank-you notification sent',
      });
    }

    let visibleEvents = events;
    if (isMemberOwnView) {
      visibleEvents = events.filter((event) =>
        ['submitted', 'family_approved', 'approved', 'rejected'].includes(event.type),
      );
      if (
        record.discrepancyReason?.trim() &&
        visibleEvents.some((event) => event.type === 'approved')
      ) {
        visibleEvents = visibleEvents.map((event) =>
          event.type === 'approved'
            ? {
                ...event,
                summary: 'Family head approved contribution',
                metadata: {
                  ...(event.metadata ?? {}),
                  comment: record.discrepancyReason?.trim(),
                },
              }
            : event,
        );
      }
    }

    visibleEvents.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    return {
      contributionId,
      referenceNumber: record.referenceNumber,
      status: record.status,
      events: visibleEvents,
    };
  }

  private isMemberOwnView(
    ctx: Awaited<ReturnType<ContributionScopeService['resolveActor']>>,
    record: { memberId: string; familyId: string | null },
  ): boolean {
    if (!ctx.memberId || ctx.memberId !== record.memberId) return false;
    if (!this.scope.canViewOwn(ctx)) return false;
    if (this.scope.canViewAll(ctx)) return false;
    if (record.familyId && this.scope.canViewFamily(ctx, record.familyId)) {
      return false;
    }
    return true;
  }

  private assertCanViewTimeline(
    ctx: Awaited<ReturnType<ContributionScopeService['resolveActor']>>,
    record: { memberId: string; familyId: string | null },
  ) {
    this.scope.assertNotChurchAdminAccountOnly(ctx);

    if (this.scope.canViewAll(ctx)) return;

    if (ctx.memberId === record.memberId && this.scope.canViewOwn(ctx)) {
      return;
    }

    if (record.familyId && this.scope.canViewFamily(ctx, record.familyId)) {
      return;
    }

    this.scope.denyHiddenFeature();
  }

  private extractActor(newValue: unknown): string | null {
    if (!newValue || typeof newValue !== 'object') return null;
    const v = newValue as Record<string, unknown>;
    return (v.actorId as string) ?? null;
  }

  private mapAuditToEvent(
    action: string,
    createdAt: Date,
    newValue: unknown,
  ): Omit<ContributionTimelineEvent, 'actorId'> | null {
    const payload =
      newValue && typeof newValue === 'object'
        ? (newValue as Record<string, unknown>)
        : {};
    const timestamp =
      (payload.timestamp as string) ?? createdAt.toISOString();
    const actorRole = (payload.actorRole as string) ?? undefined;

    switch (action) {
      case 'CONTRIBUTION_SUBMITTED':
        return {
          type: 'submitted',
          timestamp,
          actorRole,
          summary: 'Contribution submitted',
          metadata: payload,
        };
      case 'CONTRIBUTION_FAMILY_APPROVED':
        return {
          type: 'family_approved',
          timestamp,
          actorRole,
          summary: 'Family head confirmed payment — awaiting treasurer',
          metadata: payload,
        };
      case 'CONTRIBUTION_CONFIRMED':
        return {
          type: 'approved',
          timestamp,
          actorRole,
          summary: payload.treasuryVerified
            ? 'Treasurer verified and posted to ledger'
            : 'Contribution approved',
          metadata: payload,
        };
      case 'CONTRIBUTION_REJECTED':
        return {
          type: 'rejected',
          timestamp,
          actorRole,
          summary: 'Contribution rejected',
          metadata: payload,
        };
      case 'CONTRIBUTION_TREASURY_RETURNED':
        return {
          type: 'treasury_returned',
          timestamp,
          actorRole,
          summary: 'Returned to family head for review',
          metadata: payload,
        };
      case 'CONTRIBUTION_ADJUST':
        return {
          type: 'adjusted',
          timestamp,
          actorRole,
          summary: 'Contribution adjusted',
          metadata: payload,
        };
      case 'CONTRIBUTION_FAMILY_CHANGE':
        return {
          type: 'family_changed',
          timestamp,
          actorRole,
          summary: 'Family assignment corrected',
          metadata: payload,
        };
      case 'CONTRIBUTION_TYPE_CHANGE':
        return {
          type: 'type_changed',
          timestamp,
          actorRole,
          summary: 'Contribution type corrected',
          metadata: payload,
        };
      case 'CONTRIBUTION_CAMPAIGN_CHANGE':
        return {
          type: 'campaign_changed',
          timestamp,
          actorRole,
          summary: 'Campaign assignment corrected',
          metadata: payload,
        };
      case 'CONTRIBUTION_THANK_YOU_SENT':
        return {
          type: 'thank_you_sent',
          timestamp,
          actorRole,
          summary: 'Thank-you sent',
          metadata: payload,
        };
      case 'FINANCE_TRANSACTION_CREATE':
        return {
          type: 'ledger_posted',
          timestamp,
          actorRole,
          summary: 'Ledger transaction posted',
          metadata: payload,
        };
      default:
        return null;
    }
  }
}
