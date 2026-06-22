import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ChoirActivityType,
  Prisma,
  RehearsalAttendanceStatus,
  RehearsalReadinessStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ChoirMusicAccessService } from '../music/choir-music-access.service';
import { ChoirVoiceAccessService } from './choir-voice-access.service';
import { UpsertRehearsalPlanDto } from './dto/upsert-rehearsal-plan.dto';
import { ChoirNotificationsService } from '../choir-mvp/choir-notifications.service';
import { ReportsService } from '../reports/reports.service';

@Injectable()
export class RehearsalsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private musicAccess: ChoirMusicAccessService,
    private voiceAccess: ChoirVoiceAccessService,
    private choirNotifications: ChoirNotificationsService,
    private reports: ReportsService,
  ) {}

  private async assertView(userId: string, choirId?: string) {
    await this.musicAccess.requireViewRehearsal(userId, choirId);
  }

  private async assertManage(userId: string, choirId?: string) {
    await this.musicAccess.requireManageRehearsal(userId, choirId);
  }

  /** API param `eventId` maps to `ChoirActivity.id` (REHEARSAL). */
  private async resolveRehearsalActivity(activityId: string) {
    const activity = await this.prisma.choirActivity.findUnique({
      where: { id: activityId },
    });
    if (!activity || activity.activityType !== ChoirActivityType.REHEARSAL) {
      throw new NotFoundException('Rehearsal not found');
    }
    return activity;
  }

  async listVoiceSections(userId: string, choirId?: string) {
    await this.voiceAccess.requireViewVoice(userId, choirId);
    return this.prisma.voiceSection.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPlan(userId: string, eventId: string) {
    const activity = await this.resolveRehearsalActivity(eventId);
    await this.assertView(userId, activity.choirId);
    return this.prisma.rehearsalPlan.findUnique({
      where: { choirActivityId: eventId },
      include: {
        songs: { include: { song: true }, orderBy: { sortOrder: 'asc' } },
        sections: { include: { voiceSection: true } },
        leader: {
          select: { id: true, firstName: true, lastName: true, memberNumber: true },
        },
        choirActivity: {
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true,
            location: true,
          },
        },
      },
    });
  }

  async upsertPlan(userId: string, eventId: string, dto: UpsertRehearsalPlanDto) {
    const activity = await this.resolveRehearsalActivity(eventId);
    await this.assertManage(userId, activity.choirId);

    const result = await this.prisma.$transaction(async (tx) => {
      const plan = await tx.rehearsalPlan.upsert({
        where: { choirActivityId: eventId },
        create: {
          choirActivityId: eventId,
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
      newValue: { choirActivityId: eventId, songCount: dto.songs?.length ?? 0 },
    });

    void this.choirNotifications.notifyRehearsalPlanUpdated(eventId, activity.title);

    return this.getPlan(userId, eventId);
  }

  async exportAttendancePdf(userId: string, eventId: string) {
    const activity = await this.resolveRehearsalActivity(eventId);
    await this.assertView(userId, activity.choirId);
    const rows = await this.getAttendance(userId, eventId);
    const lines = rows.map(
      (row) =>
        `${row.member.firstName} ${row.member.lastName}: ${row.status}`,
    );
    const buffer = await this.reports.exportPdf('Rehearsal Attendance Report', [
      `Activity: ${eventId}`,
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
    const activity = await this.resolveRehearsalActivity(eventId);
    await this.assertManage(userId, activity.choirId);

    const saved = await this.prisma.$transaction(
      rows.map((row) =>
        this.prisma.rehearsalAttendance.upsert({
          where: {
            choirActivityId_memberId: { choirActivityId: eventId, memberId: row.memberId },
          },
          create: {
            choirActivityId: eventId,
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
      entity: 'ChoirActivity',
      entityId: eventId,
      newValue: { count: saved.length },
    });

    return saved;
  }

  async getAttendance(userId: string, eventId: string) {
    const activity = await this.resolveRehearsalActivity(eventId);
    await this.assertView(userId, activity.choirId);
    return this.prisma.rehearsalAttendance.findMany({
      where: { choirActivityId: eventId },
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
    const upcoming = await this.prisma.choirActivity.findMany({
      where: {
        activityType: ChoirActivityType.REHEARSAL,
        startAt: { gte: new Date() },
      },
      orderBy: { startAt: 'asc' },
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

    const enriched = upcoming.map((activity) => ({
      ...activity,
      readiness: this.computeReadiness(activity.rehearsalPlan),
      hasPlan: Boolean(activity.rehearsalPlan),
    }));

    const weakSections = await this.prisma.rehearsalPlanSection.findMany({
      where: {
        readinessStatus: RehearsalReadinessStatus.NEEDS_PRACTICE,
      },
      take: 10,
      include: {
        voiceSection: true,
        plan: { include: { choirActivity: true } },
      },
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
      include: { song: true, plan: { include: { choirActivity: true } } },
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
      include: { songs: true, sections: true, choirActivity: true },
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
            choirActivity: { select: { id: true, title: true, startAt: true } },
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
    return this.prisma.choirActivity.findMany({
      where: { activityType: ChoirActivityType.REHEARSAL },
      orderBy: { startAt: 'desc' },
      take: 30,
      select: {
        id: true,
        title: true,
        startAt: true,
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
            choirActivity: true,
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
      eventId: plan.choirActivityId,
      title: plan.choirActivity?.title ?? plan.choirActivityId,
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
    if (eventId) {
      const activity = await this.resolveRehearsalActivity(eventId);
      await this.assertView(userId, activity.choirId);
    } else {
      await this.assertView(userId);
    }
    const rows = await this.prisma.rehearsalAttendance.findMany({
      where: eventId ? { choirActivityId: eventId } : undefined,
      include: {
        member: { select: { firstName: true, lastName: true, memberNumber: true } },
        choirActivity: { select: { title: true, startAt: true } },
      },
      orderBy: { recordedAt: 'desc' },
    });
    const header = 'activity,member,status,recordedAt';
    const lines = rows.map((row) =>
      [
        `"${row.choirActivity.title.replace(/"/g, '""')}"`,
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
