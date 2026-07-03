import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ProtocolOccurrenceTeamStatus,
  ProtocolTeamMemberType,
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import {
  PROTOCOL_AUDIT,
  PROTOCOL_AUDIT_ENTITY,
  PROTOCOL_UNIT_CODE,
  PROTOCOL_MONTHLY_TEMPLATE_CODES,
  resolveAssignmentMode,
} from './protocol.constants';
import {
  hasProtocolManage,
  hasProtocolTeamApprove,
  hasProtocolTeamPublish,
  hasProtocolView,
} from './protocol-access.util';
import { ProtocolAssignmentEngine } from './protocol-assignment.engine';
import { ProtocolMembersService } from './protocol-members.service';
import { ProtocolTeamLeadersService } from './protocol-team-leaders.service';
import { ProtocolBackupsService } from './protocol-backups.service';
import { ProtocolNotificationsService } from './protocol-notifications.service';
import {
  calendarDayBounds,
  ensureProtocolTeamSlot,
  membersAssignedOnCalendarDay,
} from './protocol-occurrence-slots.util';

@Injectable()
export class ProtocolTeamsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private assignmentEngine: ProtocolAssignmentEngine,
    private members: ProtocolMembersService,
    private teamLeaders: ProtocolTeamLeadersService,
    private backups: ProtocolBackupsService,
    private notifications: ProtocolNotificationsService,
  ) {}

  private async actor(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    if (!hasProtocolView(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }
    return { permissions: resolved.permissions };
  }

  async generateForOccurrence(
    actorUserId: string | null,
    occurrenceId: string,
    options?: {
      memberIds?: string[];
      overrideReason?: string;
      randomizeLeader?: boolean;
      excludeMemberIds?: string[];
      monthBatchCounts?: Map<string, number>;
    },
  ) {
    const occurrence = await this.prisma.operationOccurrence.findUniqueOrThrow({
      where: { id: occurrenceId },
      include: { template: true, protocolTeam: true },
    });

    if (occurrence.protocolTeam) {
      return this.getTeamInternal(occurrence.protocolTeam.id);
    }

    const hasProtocolAssignment = await this.prisma.operationAssignment.findFirst({
      where: { occurrenceId, assignmentType: 'PROTOCOL_TEAM' },
    });
    if (!hasProtocolAssignment) {
      throw new BadRequestException('Occurrence has no protocol assignment slot');
    }

    const mode = resolveAssignmentMode(
      occurrence.template?.code,
      occurrence.type,
    );
    const recommendOpts = {
      occurrenceId,
      excludeMemberIds: options?.excludeMemberIds,
      monthBatchCounts: options?.monthBatchCounts,
    };
    const recommendations =
      mode === 'SPECIAL_EVENT'
        ? await this.assignmentEngine.recommendLowParticipation(recommendOpts)
        : await this.assignmentEngine.recommend({ ...recommendOpts, mode });

    const memberIds =
      options?.memberIds ??
      recommendations.map((r) => r.memberId);

    if (!memberIds.length) {
      throw new BadRequestException(
        options?.memberIds?.length
          ? 'Select at least one protocol member to build the team'
          : 'No eligible protocol members are available for this service under the current roster rules; service left unassigned',
      );
    }

    await this.members.ensureProfilesForMembers(memberIds);

    const team = await this.prisma.protocolOccurrenceTeam.create({
      data: {
        occurrenceId,
        assignmentMode: mode,
        generatedByUserId: actorUserId ?? undefined,
        members: {
          create: memberIds.map((memberId) => ({
            memberId,
            assignmentType: 'OFFICIAL' as ProtocolTeamMemberType,
            quotaOverrideReason: options?.overrideReason,
            quotaOverrideByUserId: options?.overrideReason
              ? actorUserId ?? undefined
              : undefined,
          })),
        },
      },
      include: {
        members: {
          include: {
            member: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        occurrence: { select: { id: true, title: true, startAt: true } },
      },
    });

    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId,
        action: PROTOCOL_AUDIT.TEAM_GENERATED,
        entity: PROTOCOL_AUDIT_ENTITY,
        entityId: team.id,
        newValue: {
          occurrenceId,
          mode,
          memberCount: memberIds.length,
          overrideReason: options?.overrideReason,
        } as Prisma.InputJsonValue,
      });
    }

    await this.finalizeTeam(team.id, actorUserId, {
      randomizeLeader: options?.randomizeLeader,
      rosterMemberIds: memberIds,
    });

    return this.getTeamInternal(team.id);
  }

  private async finalizeTeam(
    teamId: string,
    actorUserId: string | null,
    options?: { randomizeLeader?: boolean; rosterMemberIds?: string[] },
  ) {
    try {
      if (options?.randomizeLeader) {
        await this.teamLeaders.assignRandomLeader(
          actorUserId,
          teamId,
          options.rosterMemberIds ?? [],
        );
      } else {
        await this.teamLeaders.assignRecommendedLeaders(actorUserId, teamId);
      }
    } catch {
      if (options?.randomizeLeader) {
        await this.teamLeaders.assignRandomLeader(
          null,
          teamId,
          options.rosterMemberIds ?? [],
        );
      } else {
        await this.teamLeaders.assignRecommendedLeaders(null, teamId);
      }
    }
    await this.backups.persistForTeam(teamId);
    const notifyPromise = this.notifications.notifyTeamAssigned(teamId);
    if (process.env.CMMS_E2E === '1') {
      await notifyPromise;
    } else {
      void notifyPromise;
    }
  }

  private async getTeamInternal(teamId: string) {
    const team = await this.prisma.protocolOccurrenceTeam.findUniqueOrThrow({
      where: { id: teamId },
      include: {
        members: {
          include: {
            member: { select: { id: true, firstName: true, lastName: true } },
            attendance: true,
          },
        },
        occurrence: { select: { id: true, title: true, startAt: true } },
        teamLeaders: {
          include: {
            protocolTeamLeader: {
              include: {
                member: { select: { firstName: true, lastName: true } },
                choir: { select: { id: true, name: true, code: true } },
              },
            },
          },
          orderBy: { assignedAt: 'asc' },
        },
        backups: {
          include: {
            member: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { rank: 'asc' },
        },
        report: true,
      },
    });
    return {
      ...team,
      teamLeader: team.teamLeaders[0] ?? null,
    };
  }

  async assignTeamLeader(
    actorUserId: string,
    teamId: string,
    protocolTeamLeaderId: string,
    overrideReason?: string,
  ) {
    await this.actor(actorUserId);
    if (!hasProtocolManage((await this.permissions.resolveForUser(actorUserId)).permissions)) {
      throw new ForbiddenException('Coordinator only');
    }
    return this.teamLeaders.assignToTeam(
      actorUserId,
      teamId,
      protocolTeamLeaderId,
      overrideReason,
    );
  }

  async getBackups(actorUserId: string, teamId: string) {
    await this.actor(actorUserId);
    return this.backups.listForTeam(teamId);
  }

  async regenerateBackups(actorUserId: string, teamId: string) {
    await this.actor(actorUserId);
    return this.backups.persistForTeam(teamId);
  }

  async lowParticipationRecommendations(actorUserId: string, occurrenceId: string) {
    await this.actor(actorUserId);
    return this.assignmentEngine.recommendLowParticipation({ occurrenceId });
  }

  async onOccurrencePublished(occurrenceId: string, actorUserId: string) {
    const existing = await this.prisma.protocolOccurrenceTeam.findUnique({
      where: { occurrenceId },
    });
    if (existing) return this.getTeamInternal(existing.id);
    const team = await this.generateForOccurrence(actorUserId, occurrenceId);
    return team;
  }

  async transitionStatus(
    actorUserId: string,
    teamId: string,
    status: ProtocolOccurrenceTeamStatus,
  ) {
    const { permissions } = await this.actor(actorUserId);
    const team = await this.prisma.protocolOccurrenceTeam.findUniqueOrThrow({
      where: { id: teamId },
    });

    if (
      (status === 'REVIEWED' || status === 'APPROVED') &&
      !hasProtocolTeamApprove(permissions)
    ) {
      throw new ForbiddenException('Approval denied');
    }
    if (status === 'PUBLISHED' && !hasProtocolTeamPublish(permissions)) {
      throw new ForbiddenException('Publication denied');
    }
    if (status === 'COMPLETED' && !hasProtocolManage(permissions)) {
      throw new ForbiddenException('Completion denied');
    }

    const updated = await this.prisma.protocolOccurrenceTeam.update({
      where: { id: teamId },
      data: {
        status,
        reviewedAt: status === 'REVIEWED' ? new Date() : team.reviewedAt,
        approvedAt: status === 'APPROVED' ? new Date() : team.approvedAt,
        publishedAt: status === 'PUBLISHED' ? new Date() : team.publishedAt,
        completedAt: status === 'COMPLETED' ? new Date() : team.completedAt,
        approvedByUserId:
          status === 'APPROVED' || status === 'PUBLISHED'
            ? actorUserId
            : team.approvedByUserId,
      },
      include: {
        members: {
          include: {
            member: { select: { id: true, firstName: true, lastName: true } },
            attendance: true,
          },
        },
        occurrence: true,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: PROTOCOL_AUDIT.TEAM_STATUS,
      entity: PROTOCOL_AUDIT_ENTITY,
      entityId: teamId,
      newValue: { status } as Prisma.InputJsonValue,
    });

    return updated;
  }

  async assertTeamAccess(actorUserId: string, teamId: string) {
    const { permissions } = await this.actor(actorUserId);
    if (hasProtocolManage(permissions)) return;
    const ledIds = await this.teamLeaders.myTeams(actorUserId).then((t) =>
      t.map((row) => row.id),
    );
    if (ledIds.includes(teamId)) return;
    throw new ForbiddenException('Team access denied');
  }

  async listTeams(actorUserId: string, from?: Date, to?: Date) {
    const { permissions } = await this.actor(actorUserId);
    const scopedOnly =
      !hasProtocolManage(permissions) &&
      !permissions.includes('protocol.team.manage') &&
      (await this.teamLeaders.myTeams(actorUserId)).length > 0;

    if (scopedOnly) {
      return this.teamLeaders.myTeams(actorUserId);
    }

    return this.prisma.protocolOccurrenceTeam.findMany({
      where: {
        occurrence: {
          ...(from || to
            ? {
                startAt: {
                  ...(from ? { gte: from } : {}),
                  ...(to ? { lte: to } : {}),
                },
              }
            : {}),
        },
      },
      include: {
        occurrence: {
          select: { id: true, title: true, startAt: true, status: true },
        },
        members: { select: { id: true } },
      },
      orderBy: { generatedAt: 'desc' },
      take: 100,
    });
  }

  async getTeam(actorUserId: string, teamId: string) {
    await this.assertTeamAccess(actorUserId, teamId);
    return this.getTeamInternal(teamId);
  }

  async listTeamOccurrences(actorUserId: string) {
    await this.actor(actorUserId);
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    const to = new Date(now);
    to.setDate(to.getDate() + 90);

    const rows = await this.prisma.operationOccurrence.findMany({
      where: {
        startAt: { gte: from, lte: to },
        status: { in: ['PUBLISHED', 'APPROVED', 'UNDER_REVIEW', 'DRAFT'] },
        assignments: { some: { assignmentType: 'PROTOCOL_TEAM' } },
      },
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
        status: true,
        protocolTeam: { select: { id: true, status: true } },
      },
      orderBy: { startAt: 'asc' },
      take: 50,
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      startAt: row.startAt,
      endAt: row.endAt,
      status: row.status,
      hasTeam: !!row.protocolTeam,
      teamStatus: row.protocolTeam?.status ?? null,
    }));
  }

  async getTeamByOccurrence(actorUserId: string, occurrenceId: string) {
    const team = await this.prisma.protocolOccurrenceTeam.findUnique({
      where: { occurrenceId },
      select: { id: true },
    });
    if (!team) {
      throw new NotFoundException('No protocol team for this occurrence');
    }
    await this.assertTeamAccess(actorUserId, team.id);
    return this.getTeamInternal(team.id);
  }

  async recommendations(actorUserId: string, occurrenceId: string) {
    await this.actor(actorUserId);
    const occurrence = await this.prisma.operationOccurrence.findUniqueOrThrow({
      where: { id: occurrenceId },
      include: { template: true },
    });
    const mode = resolveAssignmentMode(
      occurrence.template?.code,
      occurrence.type,
    );
    return this.assignmentEngine.recommend({ occurrenceId, mode });
  }

  async getProtocolUnitId() {
    const unit = await this.prisma.operationalUnit.findFirstOrThrow({
      where: { code: PROTOCOL_UNIT_CODE, isActive: true },
    });
    return unit.id;
  }

  /**
   * Build protocol teams for every service in a monthly choir schedule plan.
   * Requires a generated schedule (GENERATED / APPROVED / PUBLISHED).
   * Processes services chronologically and applies assignment-engine rules
   * (Sunday choir composition, monthly quota, same-day member exclusion).
   */
  async generateForPlan(
    actorUserId: string,
    planId: string,
    options?: {
      skipExisting?: boolean;
      randomizeLeaders?: boolean;
      occurrenceIds?: string[];
    },
  ) {
    const { permissions } = await this.actor(actorUserId);
    if (!hasProtocolManage(permissions)) {
      throw new ForbiddenException('Coordinator permission required');
    }

    const plan = await this.prisma.choirSchedulePlan.findFirst({
      where: { id: planId, ownerScope: 'PROTOCOL' },
    });
    if (!plan) throw new NotFoundException('Schedule plan not found');
    if (!['GENERATED', 'APPROVED', 'PUBLISHED'].includes(plan.status)) {
      throw new BadRequestException(
        'Generate the monthly choir schedule before building protocol teams',
      );
    }

    const skipExisting = options?.skipExisting !== false;
    const occurrenceFilter = options?.occurrenceIds?.length
      ? new Set(options.occurrenceIds)
      : null;

    let occurrences = await this.prisma.operationOccurrence.findMany({
      where: {
        startAt: { gte: plan.startAt, lte: plan.endAt },
        cancelledAt: null,
        type: { in: ['SERVICE', 'SPECIAL_EVENT'] },
        template: { code: { in: [...PROTOCOL_MONTHLY_TEMPLATE_CODES] } },
      },
      include: { template: true, protocolTeam: true },
      orderBy: { startAt: 'asc' },
    });
    if (occurrenceFilter) {
      occurrences = occurrences.filter((o) => occurrenceFilter.has(o.id));
    }

    const built: Array<{
      occurrenceId: string;
      teamId: string;
      memberCount: number;
      title: string;
    }> = [];
    const skipped: Array<{ occurrenceId: string; title: string; reason: string }> =
      [];
    const failed: Array<{ occurrenceId: string; title: string; reason: string }> =
      [];

    const batchDayMembers = new Map<string, Set<string>>();
    const batchMonthCounts = new Map<string, number>();

    for (const occurrence of occurrences) {
      if (occurrence.protocolTeam && skipExisting) {
        skipped.push({
          occurrenceId: occurrence.id,
          title: occurrence.title,
          reason: 'Team already exists',
        });
        continue;
      }
      if (occurrence.protocolTeam && !skipExisting) {
        skipped.push({
          occurrenceId: occurrence.id,
          title: occurrence.title,
          reason: 'Team already exists — remove manually to rebuild',
        });
        continue;
      }

      await ensureProtocolTeamSlot(this.prisma, occurrence.id);

      const dayKey = calendarDayBounds(occurrence.startAt).start.toISOString();
      const busyFromDb = await membersAssignedOnCalendarDay(
        this.prisma,
        occurrence.startAt,
        occurrence.id,
      );
      const busyFromBatch = batchDayMembers.get(dayKey) ?? new Set<string>();
      const excludeMemberIds = [...busyFromDb, ...busyFromBatch];

      try {
        const team = await this.generateForOccurrence(
          actorUserId,
          occurrence.id,
          {
            excludeMemberIds,
            monthBatchCounts: batchMonthCounts,
            randomizeLeader: options?.randomizeLeaders,
          },
        );
        const memberIds = team.members.map(
          (m) => m.memberId ?? m.member.id,
        );
        const daySet = batchDayMembers.get(dayKey) ?? new Set<string>();
        for (const id of memberIds) {
          daySet.add(id);
          batchMonthCounts.set(id, (batchMonthCounts.get(id) ?? 0) + 1);
        }
        batchDayMembers.set(dayKey, daySet);

        built.push({
          occurrenceId: occurrence.id,
          teamId: team.id,
          memberCount: memberIds.length,
          title: occurrence.title,
        });
      } catch (err) {
        failed.push({
          occurrenceId: occurrence.id,
          title: occurrence.title,
          reason:
            err instanceof Error ? err.message : 'Could not build team',
        });
      }
    }

    await this.audit.log({
      userId: actorUserId,
      action: PROTOCOL_AUDIT.TEAM_GENERATED,
      entity: 'ChoirSchedulePlan',
      entityId: planId,
      newValue: {
        built: built.length,
        skipped: skipped.length,
        failed: failed.length,
      } as Prisma.InputJsonValue,
    });

    return {
      planId,
      year: plan.year,
      month: plan.month,
      built,
      skipped,
      failed,
      summary: {
        builtCount: built.length,
        skippedCount: skipped.length,
        failedCount: failed.length,
      },
    };
  }
}
