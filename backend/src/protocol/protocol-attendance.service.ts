import {

  BadRequestException,

  ForbiddenException,

  Injectable,

} from '@nestjs/common';

import { ProtocolAttendanceOutcome, ProtocolOccurrenceTeamStatus } from '@prisma/client';

import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { AuditService } from '../audit/audit.service';

import { PermissionsResolver } from '../auth/permissions.resolver';

import { PROTOCOL_AUDIT } from './protocol.constants';

import {

  hasProtocolAttendanceManage,

  hasProtocolManage,

  hasProtocolView,

} from './protocol-access.util';

import { ProtocolPerformanceService } from './protocol-performance.service';

import { ProtocolReliabilityService } from './protocol-reliability.service';

import { ProtocolTeamLeaderAccessService } from './protocol-team-leader-access.service';



@Injectable()

export class ProtocolAttendanceService {

  constructor(

    private prisma: PrismaService,

    private audit: AuditService,

    private permissions: PermissionsResolver,

    private performance: ProtocolPerformanceService,

    private reliability: ProtocolReliabilityService,

    private leaderAccess: ProtocolTeamLeaderAccessService,

  ) {}



  private async actor(userId: string) {

    const resolved = await this.permissions.resolveForUser(userId);

    if (!hasProtocolView(resolved.permissions)) {

      throw new ForbiddenException('Denied');

    }

    return { permissions: resolved.permissions };

  }

  private async ensureTeamReadyForAttendance(
    actorUserId: string,
    teamId: string,
    currentStatus: ProtocolOccurrenceTeamStatus,
  ) {
    if (currentStatus !== 'GENERATED') return;
    const { permissions } = await this.permissions.resolveForUser(actorUserId);
    const canManage =
      hasProtocolManage(permissions) || hasProtocolAttendanceManage(permissions);
    if (!canManage) {
      throw new BadRequestException(
        'Mark the team as reviewed before recording attendance',
      );
    }
    await this.prisma.protocolOccurrenceTeam.update({
      where: { id: teamId },
      data: {
        status: 'REVIEWED',
        reviewedAt: new Date(),
      },
    });
  }



  async record(

    actorUserId: string,

    teamMemberId: string,

    outcome: ProtocolAttendanceOutcome,

    notes?: string,

  ) {

    const member = await this.prisma.protocolOccurrenceTeamMember.findUniqueOrThrow({

      where: { id: teamMemberId },

      include: { attendance: true, team: true },

    });



    const canRecord = await this.leaderAccess.canManageTeamAttendance(
      actorUserId,
      member.teamId,
    );

    if (!canRecord) {
      throw new ForbiddenException('Attendance management denied');
    }

    await this.ensureTeamReadyForAttendance(
      actorUserId,
      member.teamId,
      member.team.status,
    );

    const settings = await this.prisma.protocolEngineSettings.findUniqueOrThrow({

      where: { id: 'default' },

    });

    const attendanceScoreEarned = this.reliability.outcomeGrade(outcome, settings);

    const isUpdate = !!member.attendance;



    const attendance = await this.prisma.protocolTeamAttendance.upsert({

      where: { teamMemberId },

      create: {

        teamMemberId,

        outcome,

        attendanceScoreEarned,

        recordedByUserId: actorUserId,

        notes,

      },

      update: {

        outcome,

        attendanceScoreEarned,

        recordedByUserId: actorUserId,

        notes,

        recordedAt: new Date(),

      },

    });



    await this.performance.refreshMemberStats(member.memberId);



    await this.audit.log({

      userId: actorUserId,

      action: isUpdate

        ? PROTOCOL_AUDIT.ATTENDANCE_MODIFIED

        : PROTOCOL_AUDIT.ATTENDANCE_RECORDED,

      entity: 'ProtocolTeamAttendance',

      entityId: attendance.id,

      newValue: { teamMemberId, outcome, attendanceScoreEarned } as Prisma.InputJsonValue,

    });



    return attendance;

  }

  async recordBulk(
    actorUserId: string,
    teamId: string,
    records: Array<{
      teamMemberId: string;
      outcome: ProtocolAttendanceOutcome;
      notes?: string;
    }>,
  ) {
    if (!records.length) {
      throw new BadRequestException('No attendance records provided');
    }
    const team = await this.prisma.protocolOccurrenceTeam.findUniqueOrThrow({
      where: { id: teamId },
      select: { status: true },
    });
    await this.ensureTeamReadyForAttendance(actorUserId, teamId, team.status);
    const saved = [];
    for (const row of records) {
      const member = await this.prisma.protocolOccurrenceTeamMember.findUnique({
        where: { id: row.teamMemberId },
        select: { teamId: true },
      });
      if (!member || member.teamId !== teamId) {
        throw new BadRequestException('Invalid team member for bulk attendance');
      }
      saved.push(
        await this.record(
          actorUserId,
          row.teamMemberId,
          row.outcome,
          row.notes,
        ),
      );
    }
    return { saved: saved.length, records: saved };
  }

  async listForTeam(actorUserId: string, teamId: string) {

    const canView =

      (await this.leaderAccess.canManageTeam(actorUserId, teamId)) ||

      (await this.actor(actorUserId).then(({ permissions }) =>

        hasProtocolAttendanceManage(permissions),

      ));

    if (!canView) throw new ForbiddenException('Denied');



    return this.prisma.protocolOccurrenceTeamMember.findMany({

      where: { teamId },

      include: {

        member: { select: { id: true, firstName: true, lastName: true } },

        attendance: true,

      },

    });

  }



  async myHistory(actorUserId: string) {

    const user = await this.prisma.user.findUniqueOrThrow({

      where: { id: actorUserId },

      include: { member: true },

    });

    if (!user.member) return [];



    return this.prisma.protocolOccurrenceTeamMember.findMany({

      where: { memberId: user.member.id },

      include: {

        attendance: true,

        team: {

          include: {

            occurrence: {

              select: { id: true, title: true, startAt: true, endAt: true },

            },

          },

        },

      },

      orderBy: { createdAt: 'desc' },

      take: 50,

    });

  }

  async memberHistory(actorUserId: string, memberId: string) {
    const { permissions } = await this.actor(actorUserId);
    const actorMember = await this.prisma.member.findUnique({
      where: { userId: actorUserId },
    });
    const isSelf = actorMember?.id === memberId;
    if (
      !isSelf &&
      !hasProtocolAttendanceManage(permissions) &&
      !hasProtocolManage(permissions) &&
      !hasProtocolView(permissions)
    ) {
      throw new ForbiddenException('Denied');
    }

    return this.prisma.protocolOccurrenceTeamMember.findMany({
      where: { memberId },
      include: {
        attendance: true,
        team: {
          include: {
            occurrence: {
              select: { id: true, title: true, startAt: true, endAt: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}


