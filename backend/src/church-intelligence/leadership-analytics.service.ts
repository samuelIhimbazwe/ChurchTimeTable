import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import { AuditService } from '../audit/audit.service';
import type { LeadershipAnalytics } from './church-intelligence.types';
import {
  CHURCH_INTELLIGENCE_AUDIT,
  CHURCH_INTELLIGENCE_AUDIT_ENTITY,
} from './church-intelligence.constants';

@Injectable()
export class LeadershipAnalyticsService {
  constructor(
    private prisma: PrismaService,
    private ministryAccess: MinistryAccessService,
    private audit: AuditService,
  ) {}

  async list(actorUserId: string): Promise<LeadershipAnalytics[]> {
    const visible = await this.ministryAccess.ministryIdsVisibleTo(actorUserId);
    const assignments = await this.prisma.ministryLeadershipAssignment.findMany({
      where: {
        ...(visible === null ? {} : { ministryId: { in: visible } }),
        endedAt: null,
      },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
        position: { select: { name: true } },
        ministry: { select: { name: true } },
      },
    });

    const unitAssignments =
      await this.prisma.operationalUnitLeadershipAssignment.findMany({
        where: {
          endedAt: null,
          ...(visible === null
            ? {}
            : { operationalUnit: { ministryId: { in: visible } } }),
        },
        include: {
          member: { select: { id: true, firstName: true, lastName: true } },
          position: { select: { name: true } },
          operationalUnit: {
            select: { name: true, ministryId: true },
          },
        },
      });

    const byMember = new Map<string, LeadershipAnalytics>();

    for (const row of assignments) {
      this.mergeAssignment(byMember, row.member, {
        scope: 'MINISTRY',
        positionName: row.position.name,
        contextName: row.ministry.name,
        startedAt: row.startedAt.toISOString(),
        endedAt: row.endedAt?.toISOString() ?? null,
      });
    }

    for (const row of unitAssignments) {
      this.mergeAssignment(byMember, row.member, {
        scope: 'OPERATIONAL_UNIT',
        positionName: row.position.name,
        contextName: row.operationalUnit.name,
        startedAt: row.startedAt.toISOString(),
        endedAt: row.endedAt?.toISOString() ?? null,
      });
    }

    const results: LeadershipAnalytics[] = [];
    for (const [memberId, base] of byMember) {
      const enriched = await this.enrichMember(actorUserId, memberId, base);
      results.push(enriched);
    }

    await this.audit.log({
      userId: actorUserId,
      action: CHURCH_INTELLIGENCE_AUDIT.LEADERSHIP_ANALYTICS_VIEWED,
      entity: CHURCH_INTELLIGENCE_AUDIT_ENTITY.CHURCH,
      entityId: 'leadership',
      newValue: { count: results.length },
    });

    return results.sort((a, b) => b.activeAssignments - a.activeAssignments);
  }

  async forMember(
    actorUserId: string,
    memberId: string,
  ): Promise<LeadershipAnalytics> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!member) throw new NotFoundException('Member not found');

    const base: LeadershipAnalytics = {
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`.trim(),
      activeAssignments: 0,
      averageAssignmentDays: null,
      meetingsChaired: 0,
      reportsSubmitted: 0,
      activityLevel: 'inactive',
      assignments: [],
    };

    const ministryRows = await this.prisma.ministryLeadershipAssignment.findMany({
      where: { memberId },
      include: {
        position: { select: { name: true } },
        ministry: { select: { name: true, id: true } },
      },
    });

    for (const row of ministryRows) {
      if (
        (await this.ministryAccess.ministryIdsVisibleTo(actorUserId)) !== null &&
        !(await this.ministryAccess.ministryIdsVisibleTo(actorUserId))!.includes(
          row.ministryId,
        )
      ) {
        continue;
      }
      if (!row.endedAt) base.activeAssignments += 1;
      base.assignments.push({
        scope: 'MINISTRY',
        positionName: row.position.name,
        contextName: row.ministry.name,
        startedAt: row.startedAt.toISOString(),
        endedAt: row.endedAt?.toISOString() ?? null,
      });
    }

    return this.enrichMember(actorUserId, memberId, base);
  }

  private mergeAssignment(
    map: Map<string, LeadershipAnalytics>,
    member: { id: string; firstName: string; lastName: string },
    assignment: LeadershipAnalytics['assignments'][0],
  ) {
    const existing = map.get(member.id) ?? {
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`.trim(),
      activeAssignments: 0,
      averageAssignmentDays: null,
      meetingsChaired: 0,
      reportsSubmitted: 0,
      activityLevel: 'inactive' as const,
      assignments: [],
    };
    existing.activeAssignments += 1;
    existing.assignments.push(assignment);
    map.set(member.id, existing);
  }

  private async enrichMember(
    actorUserId: string,
    memberId: string,
    base: LeadershipAnalytics,
  ): Promise<LeadershipAnalytics> {
    const since90 = new Date();
    since90.setDate(since90.getDate() - 90);

    const [meetings, activities] = await Promise.all([
      this.prisma.ministryMeetingAttendee.count({
        where: { memberId, present: true, meeting: { scheduledAt: { gte: since90 } } },
      }),
      this.prisma.ministryActivity.count({
        where: { createdAt: { gte: since90 } },
      }),
    ]);
    const reports = 0;

    const days = base.assignments
      .filter((a) => !a.endedAt)
      .map((a) => (Date.now() - new Date(a.startedAt).getTime()) / 86400000);
    const averageAssignmentDays =
      days.length > 0
        ? Math.round(days.reduce((s, d) => s + d, 0) / days.length)
        : null;

    let activityLevel: LeadershipAnalytics['activityLevel'] = 'inactive';
    const score = meetings + reports + activities;
    if (score >= 10) activityLevel = 'high';
    else if (score >= 4) activityLevel = 'medium';
    else if (score >= 1) activityLevel = 'low';

    return {
      ...base,
      averageAssignmentDays,
      meetingsChaired: meetings,
      reportsSubmitted: reports,
      activityLevel,
    };
  }
}
