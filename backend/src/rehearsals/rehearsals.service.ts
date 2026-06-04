import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  EventType,
  Prisma,
  RehearsalAttendanceStatus,
  RehearsalReadinessStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import {
  hasChoirOperations,
  hasEffectivePermission,
} from '../common/governance/governance-permissions.util';
import { UpsertRehearsalPlanDto } from './dto/upsert-rehearsal-plan.dto';
import { ChoirNotificationsService } from '../choir-mvp/choir-notifications.service';
import { ReportsService } from '../reports/reports.service';

@Injectable()
export class RehearsalsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private choirNotifications: ChoirNotificationsService,
    private reports: ReportsService,
  ) {}

  private async resolveAccess(userId: string) {
    return this.permissions.resolveForUser(userId);
  }

  private canView(resolved: { permissions: string[] }) {
    return (
      hasEffectivePermission(
        resolved.permissions,
        PERMISSIONS.CHOIR_REHEARSAL_VIEW,
      ) ||
      hasEffectivePermission(
        resolved.permissions,
        PERMISSIONS.CHOIR_REHEARSAL_MANAGE,
      ) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_MUSIC_VIEW) ||
      hasEffectivePermission(
        resolved.permissions,
        PERMISSIONS.CHOIR_MUSIC_MANAGE,
      ) ||
      hasChoirOperations(resolved.permissions) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.EVENT_READ)
    );
  }

  private canManage(resolved: { permissions: string[] }) {
    return (
      hasEffectivePermission(
        resolved.permissions,
        PERMISSIONS.CHOIR_REHEARSAL_MANAGE,
      ) ||
      hasEffectivePermission(
        resolved.permissions,
        PERMISSIONS.CHOIR_OPERATIONS_MANAGE,
      ) ||
      hasChoirOperations(resolved.permissions)
    );
  }

  private async assertView(userId: string) {
    const resolved = await this.resolveAccess(userId);
    if (!this.canView(resolved)) throw new NotFoundException('Not found');
    return resolved;
  }

  private async assertManage(userId: string) {
    const resolved = await this.resolveAccess(userId);
    if (!this.canManage(resolved)) throw new ForbiddenException('Not allowed');
    return resolved;
  }

  async listVoiceSections() {
    return this.prisma.voiceSection.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPlan(userId: string, eventId: string) {
    await this.assertView(userId);
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.type !== EventType.REHEARSAL) {
      throw new NotFoundException('Rehearsal event not found');
    }
    return this.prisma.rehearsalPlan.findUnique({
      where: { eventId },
      include: {
        songs: { include: { song: true }, orderBy: { sortOrder: 'asc' } },
        sections: { include: { voiceSection: true } },
        leader: {
          select: { id: true, firstName: true, lastName: true, memberNumber: true },
        },
        event: { select: { id: true, title: true, startTime: true, endTime: true, location: true } },
      },
    });
  }

  async upsertPlan(userId: string, eventId: string, dto: UpsertRehearsalPlanDto) {
    await this.assertManage(userId);
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.type !== EventType.REHEARSAL) {
      throw new ForbiddenException('Not a rehearsal event');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.rehearsalPlan.findUnique({ where: { eventId } });
      const plan = await tx.rehearsalPlan.upsert({
        where: { eventId },
        create: {
          eventId,
          leaderId: dto.leaderId,
          objectives: dto.objectives,
          notes: dto.notes,
        },
        update: {
          leaderId: dto.leaderId,
          objectives: dto.objectives,
          notes: dto.notes,
        },
      });

      if (dto.songs) {
        await tx.rehearsalPlanSong.deleteMany({ where: { rehearsalPlanId: plan.id } });
        for (const [index, song] of dto.songs.entries()) {
          await tx.rehearsalPlanSong.create({
            data: {
              rehearsalPlanId: plan.id,
              songId: song.songId,
              sortOrder: song.sortOrder ?? index,
              notes: song.notes,
              estimatedMinutes: song.estimatedMinutes,
              difficulty: song.difficulty,
              priority: song.priority ?? 0,
              readinessPercent: song.readinessPercent,
            },
          });
        }
      }

      if (dto.sections) {
        await tx.rehearsalPlanSection.deleteMany({
          where: { rehearsalPlanId: plan.id },
        });
        for (const section of dto.sections) {
          await tx.rehearsalPlanSection.create({
            data: {
              rehearsalPlanId: plan.id,
              voiceSectionId: section.voiceSectionId,
              focusNotes: section.focusNotes,
              readinessStatus:
                section.readinessStatus ?? RehearsalReadinessStatus.NOT_STARTED,
              readinessPercent: section.readinessPercent,
            },
          });
        }
      }

      return plan;
    });

    await this.audit.log({
      userId,
      action: 'REHEARSAL_PLAN_UPDATED',
      entity: 'RehearsalPlan',
      entityId: result.id,
      newValue: { eventId, songCount: dto.songs?.length ?? 0 },
    });

    void this.choirNotifications.notifyRehearsalPlanUpdated(eventId, event.title);

    return this.getPlan(userId, eventId);
  }

  async exportAttendancePdf(userId: string, eventId: string) {
    await this.assertView(userId);
    const rows = await this.getAttendance(userId, eventId);
    const lines = rows.map(
      (row) =>
        `${row.member.firstName} ${row.member.lastName}: ${row.status}`,
    );
    const buffer = await this.reports.exportPdf('Rehearsal Attendance Report', [
      `Event: ${eventId}`,
      `Generated: ${new Date().toISOString()}`,
      ...lines,
    ]);
    return {
      filename: `rehearsal-attendance-${eventId}.pdf`,
      mimeType: 'application/pdf',
      buffer,
    };
  }

  async recordAttendance(
    userId: string,
    eventId: string,
    rows: Array<{
      memberId: string;
      status: RehearsalAttendanceStatus;
      notes?: string;
    }>,
  ) {
    await this.assertManage(userId);
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.type !== EventType.REHEARSAL) {
      throw new NotFoundException('Rehearsal event not found');
    }

    const saved = await this.prisma.$transaction(
      rows.map((row) =>
        this.prisma.rehearsalAttendance.upsert({
          where: {
            eventId_memberId: { eventId, memberId: row.memberId },
          },
          create: {
            eventId,
            memberId: row.memberId,
            status: row.status,
            notes: row.notes,
            recordedByUserId: userId,
          },
          update: {
            status: row.status,
            notes: row.notes,
            recordedByUserId: userId,
            recordedAt: new Date(),
          },
        }),
      ),
    );

    await this.audit.log({
      userId,
      action: 'REHEARSAL_ATTENDANCE_RECORDED',
      entity: 'Event',
      entityId: eventId,
      newValue: { count: saved.length },
    });

    return saved;
  }

  async getAttendance(userId: string, eventId: string) {
    await this.assertView(userId);
    return this.prisma.rehearsalAttendance.findMany({
      where: { eventId },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberNumber: true,
          },
        },
      },
      orderBy: { recordedAt: 'desc' },
    });
  }

  private computeReadiness(plan: {
    songs: { readinessPercent: number | null }[];
    sections: { readinessPercent: number | null }[];
  } | null) {
    if (!plan) return { overall: 0, songs: 0, sections: 0 };
    const songScores = plan.songs
      .map((s) => s.readinessPercent)
      .filter((v): v is number => v != null);
    const sectionScores = plan.sections
      .map((s) => s.readinessPercent)
      .filter((v): v is number => v != null);
    const songs =
      songScores.length > 0
        ? Math.round(songScores.reduce((a, b) => a + b, 0) / songScores.length)
        : 0;
    const sections =
      sectionScores.length > 0
        ? Math.round(
            sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length,
          )
        : 0;
    const parts = [songs, sections].filter((v) => v > 0);
    const overall =
      parts.length > 0
        ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length)
        : 0;
    return { overall, songs, sections };
  }

  async dashboard(userId: string) {
    await this.assertView(userId);
    const upcoming = await this.prisma.event.findMany({
      where: {
        type: EventType.REHEARSAL,
        startTime: { gte: new Date() },
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
      orderBy: { startTime: 'asc' },
      take: 10,
      include: {
        rehearsalPlan: {
          include: {
            songs: true,
            sections: true,
          },
        },
      },
    });

    const enriched = upcoming.map((event) => ({
      ...event,
      readiness: this.computeReadiness(event.rehearsalPlan),
      hasPlan: Boolean(event.rehearsalPlan),
    }));

    const weakSections = await this.prisma.rehearsalPlanSection.findMany({
      where: {
        readinessStatus: RehearsalReadinessStatus.NEEDS_PRACTICE,
      },
      take: 10,
      include: { voiceSection: true, plan: { include: { event: true } } },
    });

    const attendanceTrend = await this.prisma.rehearsalAttendance.groupBy({
      by: ['status'],
      _count: true,
    });
    const totalMarks = attendanceTrend.reduce((sum, r) => sum + r._count, 0);
    const presentMarks =
      attendanceTrend.find((r) => r.status === RehearsalAttendanceStatus.PRESENT)
        ?._count ?? 0;
    const attendanceRate =
      totalMarks > 0 ? Math.round((presentMarks / totalMarks) * 100) : 0;

    const weakSongs = await this.prisma.rehearsalPlanSong.findMany({
      where: {
        OR: [
          { readinessPercent: { lt: 50 } },
          { readinessPercent: null },
        ],
      },
      take: 10,
      include: { song: true, plan: { include: { event: true } } },
    });

    const absentCountsRaw = await this.prisma.rehearsalAttendance.groupBy({
      by: ['memberId'],
      where: { status: RehearsalAttendanceStatus.ABSENT },
      _count: true,
    });
    const absentCounts = [...absentCountsRaw]
      .sort((a, b) => b._count - a._count)
      .slice(0, 5);
    const absentMembers = await this.prisma.member.findMany({
      where: { id: { in: absentCounts.map((r) => r.memberId) } },
      select: { id: true, firstName: true, lastName: true },
    });

    const servicePrepScore =
      enriched.length > 0
        ? Math.round(
            enriched.reduce((sum, e) => sum + e.readiness.overall, 0) /
              enriched.length,
          )
        : 0;

    return {
      upcomingRehearsals: enriched,
      weakSections,
      weakSongs,
      attendanceTrend,
      attendanceRate,
      servicePrepScore,
      frequentAbsent: absentMembers.map((m) => ({
        memberId: m.id,
        name: `${m.firstName} ${m.lastName}`,
        count:
          absentCounts.find((c) => c.memberId === m.id)?._count ?? 0,
      })),
    };
  }

  async analytics(userId: string) {
    await this.assertView(userId);
    const plans = await this.prisma.rehearsalPlan.findMany({
      include: { songs: true, sections: true, event: true },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    });

    const readinessScores = plans.map((plan) => this.computeReadiness(plan).overall);
    const averageReadiness =
      readinessScores.length > 0
        ? Math.round(
            readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length,
          )
        : 0;

    return {
      planCount: plans.length,
      averageReadiness,
      attendanceByStatus: await this.prisma.rehearsalAttendance.groupBy({
        by: ['status'],
        _count: true,
      }),
    };
  }

  async readinessDashboard(userId: string) {
    await this.assertView(userId);
    const sections = await this.prisma.voiceSection.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });

    const planSections = await this.prisma.rehearsalPlanSection.findMany({
      include: {
        voiceSection: true,
        plan: {
          include: {
            event: { select: { id: true, title: true, startTime: true } },
            songs: { include: { song: { select: { id: true, title: true } } } },
          },
        },
      },
    });

    return sections.map((section) => {
      const rows = planSections.filter((r) => r.voiceSectionId === section.id);
      const readinessPercents = rows
        .map((r) => r.readinessPercent)
        .filter((v): v is number => v != null);
      const readiness =
        readinessPercents.length > 0
          ? Math.round(
              readinessPercents.reduce((a, b) => a + b, 0) /
                readinessPercents.length,
            )
          : 0;
      const issues = rows.filter(
        (r) => r.readinessStatus === RehearsalReadinessStatus.NEEDS_PRACTICE,
      ).length;
      return {
        sectionId: section.id,
        name: section.name,
        code: section.code,
        readiness,
        assignedSongs: rows.length,
        unresolvedIssues: issues,
        leaderNotes: rows.map((r) => r.focusNotes).filter(Boolean).join(' · '),
      };
    });
  }

  async listAttendanceEvents(userId: string) {
    await this.assertView(userId);
    return this.prisma.event.findMany({
      where: { type: EventType.REHEARSAL },
      orderBy: { startTime: 'desc' },
      take: 30,
      select: {
        id: true,
        title: true,
        startTime: true,
        status: true,
      },
    });
  }

  async getReports(userId: string) {
    await this.assertView(userId);
    const [attendanceByStatus, sections, plans, absentByMember] =
      await Promise.all([
        this.prisma.rehearsalAttendance.groupBy({
          by: ['status'],
          _count: true,
        }),
        this.readinessDashboard(userId),
        this.prisma.rehearsalPlan.findMany({
          include: {
            songs: { include: { song: true } },
            sections: true,
            event: true,
          },
          take: 100,
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.rehearsalAttendance.groupBy({
          by: ['memberId', 'status'],
          _count: true,
        }),
      ]);

    const totalAttendance = attendanceByStatus.reduce(
      (sum, row) => sum + row._count,
      0,
    );
    const presentCount =
      attendanceByStatus.find((r) => r.status === RehearsalAttendanceStatus.PRESENT)
        ?._count ?? 0;
    const attendanceRate =
      totalAttendance > 0
        ? Math.round((presentCount / totalAttendance) * 100)
        : 0;

    const readinessTrends = plans.map((plan) => ({
      eventId: plan.eventId,
      title: plan.event?.title ?? plan.eventId,
      readiness: this.computeReadiness(plan).overall,
      updatedAt: plan.updatedAt,
    }));

    const frequentAbsent = absentByMember
      .filter((r) => r.status === RehearsalAttendanceStatus.ABSENT)
      .map((r) => ({ memberId: r.memberId, count: r._count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      attendanceRate,
      attendanceByStatus,
      sectionPerformance: sections,
      readinessTrends,
      frequentAbsent,
      planCount: plans.length,
    };
  }

  async exportReportsPdf(userId: string) {
    const data = await this.getReports(userId);
    const lines = [
      `Attendance rate: ${data.attendanceRate}%`,
      `Plans tracked: ${data.planCount}`,
      ...data.sectionPerformance.map(
        (s) => `${s.name}: readiness ${s.readiness}%`,
      ),
    ];
    const buffer = await this.reports.exportPdf('Rehearsal Reports', lines);
    return {
      filename: `rehearsal-reports-${new Date().toISOString().slice(0, 10)}.pdf`,
      mimeType: 'application/pdf',
      buffer,
    };
  }

  async exportAttendanceCsv(userId: string, eventId?: string) {
    await this.assertView(userId);
    const rows = await this.prisma.rehearsalAttendance.findMany({
      where: eventId ? { eventId } : undefined,
      include: {
        member: { select: { firstName: true, lastName: true, memberNumber: true } },
        event: { select: { title: true, startTime: true } },
      },
      orderBy: { recordedAt: 'desc' },
    });
    const header = 'event,member,status,recordedAt';
    const lines = rows.map((row) =>
      [
        `"${row.event.title.replace(/"/g, '""')}"`,
        `"${row.member.firstName} ${row.member.lastName}"`,
        row.status,
        row.recordedAt.toISOString(),
      ].join(','),
    );
    return {
      filename: `rehearsal-attendance-${new Date().toISOString().slice(0, 10)}.csv`,
      mimeType: 'text/csv',
      content: [header, ...lines].join('\n'),
    };
  }
}
