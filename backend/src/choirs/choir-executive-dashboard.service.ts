import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChoirJoinRequestStatus, ContributionStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { AuditService } from '../audit/audit.service';
import { PERMISSIONS, ROLES } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { activeChoirCommitteeMemberWhere } from '../common/governance/choir-committee-member.util';
import {
  hoursSince,
  isStaleHours,
  JOIN_REVIEW_STALE_HOURS,
  TREASURY_VERIFY_STALE_HOURS,
} from '../common/governance/officer-sla.util';
import { computeCareCaseSla } from '../welfare/welfare-care-desk.util';
import { ACTIVE_WELFARE_STATUSES } from '../welfare/welfare-case.util';
import { choirContributionScopeWhere } from '../finance/contribution-treasury-period.util';
import { resolvePulseWeekStart } from '../common/pulse/pulse-week.util';
import type { UpsertChoirExecutivePulseDto } from './dto/upsert-choir-executive-pulse.dto';

export type OfficerSlaItem = {
  id: string;
  label: string;
  queueCount: number;
  breachCount: number;
  staleCount: number;
  oldestHours: number | null;
  oldestLabel: string | null;
  status: 'ok' | 'attention' | 'breach';
};

export type OfficerSlaDashboard = {
  choirId: string;
  generatedAt: string;
  officers: OfficerSlaItem[];
  totals: {
    breachCount: number;
    staleCount: number;
    attentionCount: number;
  };
};

@Injectable()
export class ChoirExecutiveDashboardService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
    private audit: AuditService,
  ) {}

  async getOfficerSla(actorUserId: string, choirId: string): Promise<OfficerSlaDashboard> {
    await this.assertExecutiveView(actorUserId, choirId);
    const choir = await this.assertActiveChoir(choirId);

    const familyIds = (
      await this.prisma.family.findMany({
        where: { choirId },
        select: { id: true },
      })
    ).map((row) => row.id);
    const contributionScope = choirContributionScopeWhere(choirId, familyIds);

    const [
      joinRows,
      careRows,
      treasuryRows,
      sponsorRows,
    ] = await Promise.all([
        this.prisma.choirJoinRequest.findMany({
          where: {
            choirId,
            status: {
              in: [ChoirJoinRequestStatus.PENDING, ChoirJoinRequestStatus.NEEDS_INFO],
            },
          },
          orderBy: { createdAt: 'asc' },
          select: { id: true, createdAt: true },
        }),
        this.prisma.welfareCase.findMany({
          where: {
            choirId,
            status: { in: ACTIVE_WELFARE_STATUSES },
          },
          orderBy: [{ urgency: 'desc' }, { openedAt: 'asc' }],
          select: {
            id: true,
            openedAt: true,
            urgency: true,
          },
        }),
        this.prisma.contributionRecord.findMany({
          where: {
            AND: [
              contributionScope,
              {
                status: ContributionStatus.SUBMITTED,
                familyApprovedAt: { not: null },
                financeTransactionId: null,
                familyId: { not: null },
              },
            ],
          },
          select: { familyApprovedAt: true },
        }),
        this.prisma.contributionRecord.findMany({
          where: {
            AND: [
              contributionScope,
              {
                familyId: null,
                status: ContributionStatus.SUBMITTED,
              },
            ],
          },
          select: { createdAt: true },
        }),
      ]);

    const joinOldestHours =
      joinRows.length > 0 ? hoursSince(joinRows[0].createdAt) : null;
    const joinStale = joinRows.filter(
      (row) => isStaleHours(hoursSince(row.createdAt), JOIN_REVIEW_STALE_HOURS),
    ).length;

    const careBreaches = careRows.filter((row) => {
      const sla = computeCareCaseSla(row.openedAt, row.urgency);
      return sla.breached;
    }).length;
    const careOldestHours =
      careRows.length > 0
        ? Math.max(
            ...careRows.map((row) =>
              computeCareCaseSla(row.openedAt, row.urgency).ageHours,
            ),
          )
        : null;

    const treasuryStaleCount = treasuryRows.filter((row) =>
      row.familyApprovedAt
        ? isStaleHours(
            hoursSince(row.familyApprovedAt),
            TREASURY_VERIFY_STALE_HOURS,
          )
        : false,
    ).length;
    const sponsorStaleCount = sponsorRows.filter((row) =>
      isStaleHours(hoursSince(row.createdAt), TREASURY_VERIFY_STALE_HOURS),
    ).length;
    const treasuryQueueCount = treasuryRows.length + sponsorRows.length;
    const treasuryOldestHours = [
      ...treasuryRows.map((row) =>
        row.familyApprovedAt ? hoursSince(row.familyApprovedAt) : 0,
      ),
      ...sponsorRows.map((row) => hoursSince(row.createdAt)),
    ];
    const treasuryOldest =
      treasuryOldestHours.length > 0 ? Math.max(...treasuryOldestHours) : null;
    const treasuryStale = treasuryStaleCount + sponsorStaleCount;

    const officers: OfficerSlaItem[] = [
      this.buildOfficerItem({
        id: 'membership',
        label: 'Membership (President)',
        queueCount: joinRows.length,
        breachCount: 0,
        staleCount: joinStale,
        oldestHours: joinOldestHours,
        oldestLabel: joinOldestHours !== null ? `${joinOldestHours}h waiting` : null,
      }),
      this.buildOfficerItem({
        id: 'care',
        label: 'Care officer',
        queueCount: careRows.length,
        breachCount: careBreaches,
        staleCount: careBreaches,
        oldestHours: careOldestHours,
        oldestLabel:
          careOldestHours !== null ? `${careOldestHours}h oldest case` : null,
      }),
      this.buildOfficerItem({
        id: 'treasurer',
        label: 'Treasurer verification',
        queueCount: treasuryQueueCount,
        breachCount: treasuryStale,
        staleCount: treasuryStale,
        oldestHours: treasuryOldest,
        oldestLabel:
          treasuryOldest !== null ? `${treasuryOldest}h oldest gift` : null,
      }),
    ];

    const breachCount = officers.reduce((sum, item) => sum + item.breachCount, 0);
    const staleCount = officers.reduce((sum, item) => sum + item.staleCount, 0);
    const attentionCount = officers.filter((item) => item.status !== 'ok').length;

    return {
      choirId,
      generatedAt: new Date().toISOString(),
      officers,
      totals: {
        breachCount,
        staleCount,
        attentionCount,
      },
    };
  }

  async exportExecutivePackPdf(actorUserId: string, choirId: string) {
    const dashboard = await this.getOfficerSla(actorUserId, choirId);
    const choir = await this.assertActiveChoir(choirId);

    const lines = [
      `Choir: ${choir.name}`,
      `Generated: ${dashboard.generatedAt}`,
      `Executive officer SLA snapshot`,
      '',
      `Officers needing attention: ${dashboard.totals.attentionCount}`,
      `SLA breaches / stale queues: ${dashboard.totals.breachCount}`,
      '',
      ...dashboard.officers.flatMap((officer) => [
        `${officer.label}`,
        `  Queue: ${officer.queueCount} | Breaches: ${officer.breachCount} | Stale: ${officer.staleCount}`,
        `  Oldest: ${officer.oldestLabel ?? '—'} | Status: ${officer.status}`,
        '',
      ]),
    ];

    const buffer = await this.buildPdf(`Executive pack — ${choir.name}`, lines);
    const stamp = new Date().toISOString().slice(0, 10);

    await this.audit.log({
      userId: actorUserId,
      action: 'EXECUTIVE_PACK_EXPORT',
      entity: 'Choir',
      entityId: choirId,
      newValue: {
        breachCount: dashboard.totals.breachCount,
        attentionCount: dashboard.totals.attentionCount,
      },
    });

    return {
      filename: `choir-executive-pack-${stamp}.pdf`,
      buffer,
      mimeType: 'application/pdf',
    };
  }

  async getExecutivePulse(actorUserId: string, choirId: string, weekStart?: string) {
    await this.assertExecutiveView(actorUserId, choirId);
    const resolvedWeekStart = resolvePulseWeekStart(weekStart);

    const entry = await this.prisma.choirExecutivePulseEntry.findUnique({
      where: {
        choirId_weekStart: {
          choirId,
          weekStart: resolvedWeekStart,
        },
      },
      include: {
        recordedBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    const recent = await this.prisma.choirExecutivePulseEntry.findMany({
      where: { choirId },
      orderBy: { weekStart: 'desc' },
      take: 8,
      select: {
        weekStart: true,
        score: true,
        note: true,
      },
    });

    return {
      choirId,
      weekStart: resolvedWeekStart.toISOString(),
      entry: entry
        ? {
            score: entry.score,
            note: entry.note,
            recordedByName: entry.recordedBy
              ? `${entry.recordedBy.firstName} ${entry.recordedBy.lastName}`.trim()
              : null,
            updatedAt: entry.updatedAt.toISOString(),
          }
        : null,
      recent: recent.map((row) => ({
        weekStart: row.weekStart.toISOString(),
        score: row.score,
        note: row.note,
      })),
    };
  }

  async upsertExecutivePulse(
    actorUserId: string,
    choirId: string,
    dto: UpsertChoirExecutivePulseDto,
  ) {
    const ctx = await this.assertExecutivePulseRecord(actorUserId, choirId);
    const weekStart = resolvePulseWeekStart(dto.weekStart);

    const entry = await this.prisma.choirExecutivePulseEntry.upsert({
      where: {
        choirId_weekStart: {
          choirId,
          weekStart,
        },
      },
      create: {
        choirId,
        weekStart,
        score: dto.score,
        note: dto.note?.trim() || null,
        recordedByMemberId: ctx.memberId ?? null,
      },
      update: {
        score: dto.score,
        note: dto.note?.trim() || null,
        recordedByMemberId: ctx.memberId ?? null,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CHOIR_EXECUTIVE_PULSE_UPSERT',
      entity: 'ChoirExecutivePulseEntry',
      entityId: entry.id,
      newValue: { score: dto.score, weekStart: weekStart.toISOString() },
    });

    return {
      choirId,
      weekStart: weekStart.toISOString(),
      entry: {
        score: entry.score,
        note: entry.note,
        updatedAt: entry.updatedAt.toISOString(),
      },
    };
  }

  private buildOfficerItem(input: {
    id: string;
    label: string;
    queueCount: number;
    breachCount: number;
    staleCount: number;
    oldestHours: number | null;
    oldestLabel: string | null;
  }): OfficerSlaItem {
    const hasBreach = input.breachCount > 0;
    const hasStale = input.staleCount > 0;
    const status: OfficerSlaItem['status'] =
      hasBreach ? 'breach' : hasStale || input.queueCount > 0 ? 'attention' : 'ok';
    return {
      id: input.id,
      label: input.label,
      queueCount: input.queueCount,
      breachCount: input.breachCount,
      staleCount: input.staleCount,
      oldestHours: input.oldestHours,
      oldestLabel: input.oldestLabel,
      status,
    };
  }

  private async assertExecutiveView(actorUserId: string, choirId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      resolved.roles.includes(ROLES.CHOIR_PRESIDENT) ||
      resolved.roles.includes(ROLES.CHOIR_VICE_PRESIDENT) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_JOIN_REVIEW) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_OPERATIONS_MANAGE)
    ) {
      return;
    }

    const memberId = resolved.memberId;
    if (memberId) {
      const execSeat = await this.prisma.choirCommitteeMember.findFirst({
        where: {
          choirId,
          memberId,
          role: {
            name: {
              in: ['president', 'vice_president', 'vice-president'],
            },
          },
          ...activeChoirCommitteeMemberWhere(),
        },
        select: { id: true },
      });
      if (execSeat) return;
    }

    throw new ForbiddenException('Executive dashboard access required');
  }

  private async assertExecutivePulseRecord(actorUserId: string, choirId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    const memberId = resolved.memberId;
    if (!memberId) {
      throw new ForbiddenException('Member profile required to record executive pulse');
    }

    const pulseSeat = await this.prisma.choirCommitteeMember.findFirst({
      where: {
        choirId,
        memberId,
        role: {
          name: {
            in: ['president', 'vice_president', 'vice-president', 'secretary'],
          },
        },
        ...activeChoirCommitteeMemberWhere(),
      },
      select: { id: true },
    });
    if (pulseSeat) {
      return { memberId };
    }

    await this.assertExecutiveView(actorUserId, choirId);
    return { memberId };
  }

  private async assertActiveChoir(choirId: string) {
    const choir = await this.prisma.choir.findFirst({
      where: { id: choirId, isActive: true },
      select: { id: true, name: true },
    });
    if (!choir) {
      throw new NotFoundException('Choir not found');
    }
    return choir;
  }

  private buildPdf(title: string, lines: string[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.fontSize(18).text(title, { underline: true });
      doc.moveDown();
      doc.fontSize(10);
      for (const line of lines) doc.text(line);
      doc.end();
    });
  }
}
