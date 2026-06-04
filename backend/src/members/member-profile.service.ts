import { Injectable } from '@nestjs/common';
import {
  ContributionStatus,
  EventStatus,
  Prisma,
  WelfareCaseStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceScoringService } from '../attendance/attendance-scoring.service';
import { ContributionEffectiveAmountService } from '../finance/contribution-effective-amount.service';
import { MemberProfileAccessService } from './member-profile-access.service';
import { UpdateMemberProfileDto } from './dto/update-member-profile.dto';
import { AuditService } from '../audit/audit.service';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { getAllowedMemberTransitions } from './dto/update-member-status.dto';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';

const OPEN_WELFARE_STATUSES: WelfareCaseStatus[] = [
  WelfareCaseStatus.OPEN,
  WelfareCaseStatus.UNDER_REVIEW,
  WelfareCaseStatus.ACTIVE_SUPPORT,
];

@Injectable()
export class MemberProfileService {
  constructor(
    private prisma: PrismaService,
    private access: MemberProfileAccessService,
    private attendanceScoring: AttendanceScoringService,
    private effective: ContributionEffectiveAmountService,
    private audit: AuditService,
  ) {}

  async getProfileCenter(actorUserId: string, memberId: string) {
    const { member, permissions, isSelf, actorMemberId } =
      await this.access.assertCanViewMemberProfile(actorUserId, memberId);

    const canViewFamilyContributions =
      await this.access.canViewMemberContributions(
        actorUserId,
        memberId,
        permissions,
        isSelf,
        actorMemberId,
      );
    const showContributions = this.access.canViewContributionDetails(
      permissions,
      isSelf,
      canViewFamilyContributions,
    );
    const showWelfare = this.access.canViewWelfareDetails(permissions, isSelf);
    const showDiscipline = this.access.canViewDisciplineDetails(
      permissions,
      isSelf,
    );
    const canViewAttendanceDetail = await this.access.canViewAttendanceDetail(
      permissions,
      isSelf,
      actorMemberId,
      memberId,
    );

    const profile = await this.prisma.memberProfile.findUnique({
      where: { memberId },
    });

    const familyMembership = await this.prisma.familyMember.findUnique({
      where: { memberId },
      include: { family: true },
    });

    const attendanceScore = await this.attendanceScoring.scoreMember(memberId);

    let contributionSummary = null;
    if (showContributions) {
      const confirmed = await this.prisma.contributionRecord.findMany({
        where: { memberId, status: ContributionStatus.CONFIRMED },
        include: { adjustments: { select: { adjustmentAmount: true } } },
      });
      const pending = await this.prisma.contributionRecord.aggregate({
        where: { memberId, status: ContributionStatus.SUBMITTED },
        _sum: { claimedAmount: true },
        _count: true,
      });
      const effectiveTotal = confirmed.reduce(
        (sum, row) => sum + this.effective.computeFromRow(row),
        0,
      );
      contributionSummary = {
        confirmedCount: confirmed.length,
        confirmedEffectiveTotal: effectiveTotal,
        pendingCount: pending._count,
        pendingClaimedTotal: Number(pending._sum.claimedAmount ?? 0),
      };
    }

    let welfareSummary = null;
    if (showWelfare) {
      const openCases = await this.prisma.welfareCase.count({
        where: { memberId, status: { in: OPEN_WELFARE_STATUSES } },
      });
      welfareSummary = { openCases };
    }

    const leadership = await this.prisma.familyLeadershipHistory.findMany({
      where: { memberId, endedAt: null },
      include: { family: { select: { familyName: true, familyCode: true } } },
      orderBy: { startedAt: 'desc' },
    });

    const choirCommittee = await this.prisma.choirCommitteeMember.findMany({
      where: { memberId },
      include: { role: { select: { name: true } } },
    });

    const upcomingAssignments = await this.prisma.eventAssignment.findMany({
      where: {
        memberId,
        event: {
          startTime: { gte: new Date() },
          status: { in: [EventStatus.SCHEDULED, EventStatus.IN_PROGRESS] },
        },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            type: true,
            startTime: true,
            location: true,
          },
        },
      },
      orderBy: { event: { startTime: 'asc' } },
      take: 8,
    });

    const recentActivity = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { entity: 'Member', entityId: memberId },
          {
            entity: 'ContributionRecord',
            entityId: { in: await this.contributionIds(memberId) },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const statusHistoryPreview = await this.prisma.memberStatusHistory.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      member: {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        memberNumber: member.memberNumber,
        phone: member.phone,
        ministry: member.ministry,
        status: member.status,
        createdAt: member.createdAt,
        user: member.user,
      },
      profile: profile ? this.serializeProfile(profile) : null,
      family: familyMembership
        ? {
            familyId: familyMembership.familyId,
            familyName: familyMembership.family.familyName,
            familyCode: familyMembership.family.familyCode,
            role: familyMembership.role,
          }
        : null,
      leadership: {
        familyRoles: leadership.map((row) => ({
          familyId: row.familyId,
          familyName: row.family.familyName,
          familyCode: row.family.familyCode,
          role: row.role,
          since: row.startedAt,
        })),
        choirCommitteeRoles: choirCommittee.map((row) => ({
          roleName: row.role.name,
          assignedAt: row.assignedAt,
        })),
      },
      dashboard: {
        attendanceScore,
        contributionSummary,
        welfareSummary,
        upcomingAssignments: upcomingAssignments.map((row) => ({
          eventId: row.event.id,
          title: row.event.title,
          type: row.event.type,
          startTime: row.event.startTime,
          location: row.event.location,
        })),
        recentAuditActivity: recentActivity.map((row) => ({
          action: row.action,
          entity: row.entity,
          createdAt: row.createdAt,
        })),
        statusHistoryPreview: statusHistoryPreview.map((row) => ({
          id: row.id,
          fromStatus: row.fromStatus,
          toStatus: row.toStatus,
          reason: row.reason,
          createdAt: row.createdAt,
        })),
      },
      capabilities: {
        canEditProfile:
          isSelf ||
          hasEffectivePermission(permissions, PERMISSIONS.MEMBER_MANAGE),
        canViewContributions: showContributions,
        canViewWelfare: showWelfare,
        canViewDiscipline: showDiscipline,
        canViewAttendanceDetail,
        canManageStatus: this.access.canManageStatus(permissions),
      },
      allowedStatusTransitions: this.access.canManageStatus(permissions)
        ? getAllowedMemberTransitions(member.status)
        : [],
    };
  }

  async getStatusHistory(actorUserId: string, memberId: string, limit = 50) {
    await this.access.assertCanViewMemberProfile(actorUserId, memberId);
    const take = Math.min(Math.max(limit, 1), 100);
    return this.prisma.memberStatusHistory.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async getAttendance(actorUserId: string, memberId: string) {
    const { permissions, isSelf, actorMemberId } =
      await this.access.assertCanViewMemberProfile(actorUserId, memberId);
    const allowed = await this.access.canViewAttendanceDetail(
      permissions,
      isSelf,
      actorMemberId,
      memberId,
    );
    if (!allowed) {
      return {
        allowed: false,
        score: await this.attendanceScoring.scoreMember(memberId),
        records: [],
        trends: [],
        latenessCount: 0,
        voluntaryServiceCount: 0,
      };
    }

    const records = await this.prisma.attendance.findMany({
      where: { memberId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            type: true,
            startTime: true,
            endTime: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const score = await this.attendanceScoring.scoreMember(memberId);

    return {
      allowed: true,
      score,
      records,
      trends: this.buildMonthlyTrend(records),
      latenessCount: records.filter((r) => r.operationalStatus === 'LATE').length,
      voluntaryServiceCount: records.filter((r) => r.voluntaryExtra).length,
    };
  }

  async getContributions(
    actorUserId: string,
    memberId: string,
    page = 1,
    limit = 20,
  ) {
    const { permissions, isSelf, actorMemberId } =
      await this.access.assertCanViewMemberProfile(actorUserId, memberId);
    const allowed = await this.access.canViewMemberContributions(
      actorUserId,
      memberId,
      permissions,
      isSelf,
      actorMemberId,
    );
    if (!allowed) {
      return paginatedResult([], 0, page, limit);
    }

    const { skip, take } = paginate(page, limit);
    const [total, rows] = await Promise.all([
      this.prisma.contributionRecord.count({ where: { memberId } }),
      this.prisma.contributionRecord.findMany({
        where: { memberId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          contributionTypeCatalog: { select: { id: true, code: true, name: true } },
          contributionCampaign: { select: { id: true, name: true, status: true } },
          adjustments: {
            select: {
              id: true,
              adjustmentAmount: true,
              category: true,
              reason: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ]);

    const items = rows.map((row) => ({
      ...row,
      effectiveAmount:
        row.status === ContributionStatus.CONFIRMED
          ? this.effective.computeFromRow(row)
          : Number(row.claimedAmount ?? row.amount),
    }));

    return paginatedResult(items, total, page, limit);
  }

  async getWelfareCases(actorUserId: string, memberId: string, limit = 20) {
    const { permissions, isSelf } =
      await this.access.assertCanViewMemberProfile(actorUserId, memberId);
    const showWelfare = this.access.canViewWelfareDetails(permissions, isSelf);
    if (!showWelfare) {
      return { items: [], meta: { total: 0, page: 1, limit, totalPages: 0 } };
    }

    const take = Math.min(Math.max(limit, 1), 50);
    const items = await this.prisma.welfareCase.findMany({
      where: { memberId },
      orderBy: { updatedAt: 'desc' },
      take,
      include: {
        category: { select: { id: true, name: true } },
        coordinator: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return {
      items,
      meta: { total: items.length, page: 1, limit: take, totalPages: 1 },
    };
  }

  async upsertProfile(
    actorUserId: string,
    memberId: string,
    dto: UpdateMemberProfileDto,
  ) {
    const { permissions, isSelf } =
      await this.access.assertCanViewMemberProfile(actorUserId, memberId);
    this.access.assertCanManageProfile(permissions, isSelf);

    const data = this.buildProfileWriteData(dto);
    const existing = await this.prisma.memberProfile.findUnique({
      where: { memberId },
    });
    const profile = existing
      ? await this.prisma.memberProfile.update({
          where: { memberId },
          data,
        })
      : await this.prisma.memberProfile.create({
          data: this.buildProfileCreateData(memberId, dto),
        });

    await this.audit.log({
      userId: actorUserId,
      action: 'MEMBER_PROFILE_UPDATE',
      entity: 'MemberProfile',
      entityId: profile.id,
      newValue: { memberId },
    });

    return this.serializeProfile(profile);
  }

  private buildProfileCreateData(
    memberId: string,
    dto: UpdateMemberProfileDto,
  ): Prisma.MemberProfileUncheckedCreateInput {
    const data: Prisma.MemberProfileUncheckedCreateInput = { memberId };
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.voicePart !== undefined) data.voicePart = dto.voicePart;
    if (dto.dateOfBirth) data.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.emergencyContactName !== undefined) {
      data.emergencyContactName = dto.emergencyContactName;
    }
    if (dto.emergencyContactPhone !== undefined) {
      data.emergencyContactPhone = dto.emergencyContactPhone;
    }
    if (dto.baptismDate) data.baptismDate = new Date(dto.baptismDate);
    if (dto.choirJoinDate) data.choirJoinDate = new Date(dto.choirJoinDate);
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.skills !== undefined) data.skillsJson = dto.skills;
    if (dto.instruments !== undefined) data.instrumentsJson = dto.instruments;
    return data;
  }

  private buildProfileWriteData(
    dto: UpdateMemberProfileDto,
  ): Prisma.MemberProfileUpdateInput {
    const data: Prisma.MemberProfileUpdateInput = {};
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.voicePart !== undefined) data.voicePart = dto.voicePart;
    if (dto.dateOfBirth !== undefined) {
      data.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    }
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.emergencyContactName !== undefined) {
      data.emergencyContactName = dto.emergencyContactName;
    }
    if (dto.emergencyContactPhone !== undefined) {
      data.emergencyContactPhone = dto.emergencyContactPhone;
    }
    if (dto.baptismDate !== undefined) {
      data.baptismDate = dto.baptismDate ? new Date(dto.baptismDate) : null;
    }
    if (dto.choirJoinDate !== undefined) {
      data.choirJoinDate = dto.choirJoinDate ? new Date(dto.choirJoinDate) : null;
    }
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.skills !== undefined) data.skillsJson = dto.skills;
    if (dto.instruments !== undefined) data.instrumentsJson = dto.instruments;
    return data;
  }

  private serializeProfile(profile: Prisma.MemberProfileGetPayload<object>) {
    return {
      id: profile.id,
      memberId: profile.memberId,
      gender: profile.gender,
      voicePart: profile.voicePart,
      dateOfBirth: profile.dateOfBirth,
      address: profile.address,
      emergencyContactName: profile.emergencyContactName,
      emergencyContactPhone: profile.emergencyContactPhone,
      baptismDate: profile.baptismDate,
      choirJoinDate: profile.choirJoinDate,
      notes: profile.notes,
      skills: (profile.skillsJson as string[] | null) ?? [],
      instruments: (profile.instrumentsJson as string[] | null) ?? [],
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  private buildMonthlyTrend(
    records: Array<{ createdAt: Date; operationalStatus: string | null }>,
  ) {
    const buckets = new Map<
      string,
      { present: number; absent: number; late: number }
    >();
    for (const row of records) {
      const key = `${row.createdAt.getFullYear()}-${String(row.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const bucket = buckets.get(key) ?? { present: 0, absent: 0, late: 0 };
      if (row.operationalStatus === 'LATE') bucket.late++;
      else if (
        row.operationalStatus === 'PRESENT' ||
        row.operationalStatus === 'VOLUNTARY_EXTRA'
      ) {
        bucket.present++;
      } else bucket.absent++;
      buckets.set(key, bucket);
    }
    return [...buckets.entries()].map(([month, counts]) => ({
      month,
      ...counts,
    }));
  }

  private async contributionIds(memberId: string) {
    const rows = await this.prisma.contributionRecord.findMany({
      where: { memberId },
      select: { id: true },
      take: 50,
    });
    return rows.map((r) => r.id);
  }
}
