import { ForbiddenException, Injectable } from '@nestjs/common';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  hoursSince,
  isStaleHours,
  PROTOCOL_CLAIM_REVIEW_STALE_HOURS,
  PROTOCOL_REPLACEMENT_REVIEW_STALE_HOURS,
  PROTOCOL_TEAM_PUBLISH_STALE_HOURS,
} from './protocol-sla.util';

export type ProtocolOfficerSlaItem = {
  id: string;
  label: string;
  queueCount: number;
  breachCount: number;
  staleCount: number;
  oldestHours: number | null;
  oldestLabel: string | null;
  status: 'ok' | 'attention' | 'breach';
};

export type ProtocolOfficerSlaDashboard = {
  generatedAt: string;
  officers: ProtocolOfficerSlaItem[];
  totals: {
    breachCount: number;
    staleCount: number;
    attentionCount: number;
  };
};

@Injectable()
export class ProtocolOfficerSlaService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
  ) {}

  private async assertOfficerSlaAccess(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    const allowed =
      hasEffectivePermission(resolved.permissions, PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.PROTOCOL_MANAGE) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.PROTOCOL_REPORT) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR);
    if (!allowed) {
      throw new ForbiddenException('Officer SLA access required');
    }
    return resolved;
  }

  private buildOfficerItem(input: {
    id: string;
    label: string;
    queueCount: number;
    breachCount: number;
    staleCount: number;
    oldestHours: number | null;
    oldestLabel: string | null;
  }): ProtocolOfficerSlaItem {
    const hasBreach = input.breachCount > 0;
    const hasStale = input.staleCount > 0;
    const status: ProtocolOfficerSlaItem['status'] =
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

  async getOfficerSla(actorUserId: string): Promise<ProtocolOfficerSlaDashboard> {
    await this.assertOfficerSlaAccess(actorUserId);
    const now = new Date();

    const [claimRows, replacementRows, draftTeams] = await Promise.all([
      this.prisma.protocolMembershipClaim.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        select: { id: true, createdAt: true },
      }),
      this.prisma.protocolReplacementRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        select: { id: true, createdAt: true },
      }),
      this.prisma.protocolOccurrenceTeam.findMany({
        where: {
          status: { in: ['GENERATED', 'REVIEWED', 'APPROVED'] },
          occurrence: { startAt: { gte: now } },
        },
        orderBy: { generatedAt: 'asc' },
        select: { id: true, generatedAt: true, status: true },
      }),
    ]);

    const claimOldest =
      claimRows.length > 0 ? hoursSince(claimRows[0].createdAt) : null;
    const claimStale = claimRows.filter((row) =>
      isStaleHours(hoursSince(row.createdAt), PROTOCOL_CLAIM_REVIEW_STALE_HOURS),
    ).length;

    const replacementOldest =
      replacementRows.length > 0
        ? hoursSince(replacementRows[0].createdAt)
        : null;
    const replacementStale = replacementRows.filter((row) =>
      isStaleHours(
        hoursSince(row.createdAt),
        PROTOCOL_REPLACEMENT_REVIEW_STALE_HOURS,
      ),
    ).length;

    const teamOldestHours = draftTeams.map((row) => hoursSince(row.generatedAt));
    const teamOldest =
      teamOldestHours.length > 0 ? Math.max(...teamOldestHours) : null;
    const teamStale = draftTeams.filter((row) =>
      isStaleHours(
        hoursSince(row.generatedAt),
        PROTOCOL_TEAM_PUBLISH_STALE_HOURS,
      ),
    ).length;

    const officers: ProtocolOfficerSlaItem[] = [
      this.buildOfficerItem({
        id: 'membership',
        label: 'Membership (claims)',
        queueCount: claimRows.length,
        breachCount: claimStale,
        staleCount: claimStale,
        oldestHours: claimOldest,
        oldestLabel:
          claimOldest !== null ? `${claimOldest}h oldest claim` : null,
      }),
      this.buildOfficerItem({
        id: 'coordinator',
        label: 'Team publish (coordinator)',
        queueCount: draftTeams.length,
        breachCount: teamStale,
        staleCount: teamStale,
        oldestHours: teamOldest,
        oldestLabel:
          teamOldest !== null ? `${teamOldest}h oldest draft` : null,
      }),
      this.buildOfficerItem({
        id: 'replacements',
        label: 'Replacements',
        queueCount: replacementRows.length,
        breachCount: replacementStale,
        staleCount: replacementStale,
        oldestHours: replacementOldest,
        oldestLabel:
          replacementOldest !== null
            ? `${replacementOldest}h oldest request`
            : null,
      }),
    ];

    const breachCount = officers.reduce((sum, item) => sum + item.breachCount, 0);
    const staleCount = officers.reduce((sum, item) => sum + item.staleCount, 0);
    const attentionCount = officers.filter((item) => item.status !== 'ok').length;

    return {
      generatedAt: new Date().toISOString(),
      officers,
      totals: {
        breachCount,
        staleCount,
        attentionCount,
      },
    };
  }
}
