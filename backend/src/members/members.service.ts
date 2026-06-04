import { Injectable, NotFoundException } from '@nestjs/common';
import {
  MemberStatus,
  MinistryScope,
  NotificationRuleTrigger,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OperationalScopeService } from '../governance/operational-scope.service';
import {
  hasProtocolCoordination,
  hasProtocolOversight,
} from '../common/governance/governance-permissions.util';
import {
  isValidMemberTransition,
  UpdateMemberStatusDto,
} from './dto/update-member-status.dto';
import { BusinessRuleException } from '../common/exceptions/business.exception';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';
import { NotificationRuleGateService } from '../pilot-ready/notification-rule-gate.service';

export type MemberRosterItem = {
  id: string;
  firstName: string;
  lastName: string;
  memberNumber: string | null;
  ministry: MinistryScope;
  status: MemberStatus;
};

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
    private operationalScope: OperationalScopeService,
    private ruleGate: NotificationRuleGateService,
  ) {}

  async findAll(
    page = 1,
    limit = 20,
    filters?: { status?: MemberStatus; ministry?: MinistryScope },
  ) {
    const { skip, take } = paginate(page, limit);
    const where: Prisma.MemberWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.ministry) where.ministry = filters.ministry;

    const [items, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        skip,
        take,
        include: { user: { select: { email: true } } },
        orderBy: { lastName: 'asc' },
      }),
      this.prisma.member.count({ where }),
    ]);

    return paginatedResult(items, total, page, limit);
  }

  async findRoster(
    actorUserId: string,
    page = 1,
    limit = 20,
    filters?: { status?: MemberStatus; ministry?: MinistryScope },
  ) {
    const scope = await this.operationalScope.buildForUser(actorUserId);
    const { skip, take } = paginate(page, limit);
    const where: Prisma.MemberWhereInput = {
      status: filters?.status ?? MemberStatus.ACTIVE,
    };
    if (filters?.ministry) where.ministry = filters.ministry;

    const narrowToTeam =
      scope.scopedMemberIds.length > 0 &&
      !hasProtocolOversight(scope.permissions) &&
      !hasProtocolCoordination(scope.permissions);

    if (narrowToTeam) {
      where.id = { in: scope.scopedMemberIds };
    }

    const [rows, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        skip,
        take,
        orderBy: { lastName: 'asc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          memberNumber: true,
          ministry: true,
          status: true,
        },
      }),
      this.prisma.member.count({ where }),
    ]);

    const items: MemberRosterItem[] = rows.map((row) => ({
      ...row,
      memberNumber: row.memberNumber ?? null,
    }));

    return paginatedResult(items, total, page, limit);
  }

  async findOne(id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: { user: { select: { email: true, id: true } } },
    });
    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  async updateStatus(
    id: string,
    dto: UpdateMemberStatusDto,
    actorUserId: string,
  ) {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) throw new NotFoundException('Member not found');

    if (!isValidMemberTransition(member.status, dto.status)) {
      throw new BusinessRuleException(
        `Invalid status transition from ${member.status} to ${dto.status}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.member.update({
        where: { id },
        data: { status: dto.status },
      });
      await tx.memberStatusHistory.create({
        data: {
          memberId: id,
          fromStatus: member.status,
          toStatus: dto.status,
          reason: dto.reason,
          changedByUserId: actorUserId,
        },
      });
      return row;
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'MEMBER_STATUS_CHANGE',
      entity: 'Member',
      entityId: id,
      oldValue: { status: member.status },
      newValue: { status: dto.status },
    });

    if (
      (member.status === MemberStatus.NEW_MEMBER ||
        member.status === MemberStatus.PROBATION) &&
      dto.status === MemberStatus.ACTIVE
    ) {
      const user = await this.prisma.user.findUnique({
        where: { id: member.userId },
        select: { id: true },
      });
      if (user && (await this.ruleGate.allows(NotificationRuleTrigger.REQUEST_APPROVED))) {
        await this.notifications.notifyMemberApproved(user.id);
      }
    } else if (
      member.status === MemberStatus.NEW_MEMBER &&
      dto.status === MemberStatus.TEMPORARILY_INACTIVE
    ) {
      const user = await this.prisma.user.findUnique({
        where: { id: member.userId },
        select: { id: true },
      });
      if (user && (await this.ruleGate.allows(NotificationRuleTrigger.REQUEST_REJECTED))) {
        await this.notifications.notifyMemberRejected(user.id);
      }
    }

    return updated;
  }

  async getScores(memberId: string) {
    const records = await this.prisma.attendance.findMany({
      where: { memberId },
      select: {
        physicalStatus: true,
        reasonCategory: true,
      },
    });

    const total = records.length;
    const present = records.filter(
      (r) => r.physicalStatus === 'PRESENT' || r.physicalStatus === 'LATE',
    ).length;
    const excused = records.filter(
      (r) =>
        r.physicalStatus === 'ABSENT' && r.reasonCategory === 'EXCUSED',
    ).length;

    const attendanceRate = total ? present / total : 0;
    const responsibilityScore = total ? (present + excused) / total : 0;

    return {
      totalEvents: total,
      presentCount: present,
      excusedAbsences: excused,
      attendanceRate: Math.round(attendanceRate * 10000) / 100,
      responsibilityScore: Math.round(responsibilityScore * 10000) / 100,
    };
  }

  async getAvailability(memberId: string, eventId?: string) {
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Member not found');

    const scores = await this.getScores(memberId);
    const recentAbsences = await this.prisma.attendance.findMany({
      where: {
        memberId,
        physicalStatus: 'ABSENT',
        reasonCategory: { in: ['EXCUSED', 'UNEXCUSED'] },
      },
      include: { event: { select: { startTime: true } } },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    const unavailableDates = recentAbsences
      .map((a) => a.event.startTime.toISOString().split('T')[0])
      .filter((d, i, arr) => arr.indexOf(d) === i);

    const conflicts: Array<{ eventId: string; title: string }> = [];
    if (eventId) {
      const event = await this.prisma.event.findUnique({ where: { id: eventId } });
      if (event) {
        const overlapping = await this.prisma.eventAssignment.findMany({
          where: {
            memberId,
            eventId: { not: eventId },
            event: {
              status: { not: 'CANCELLED' },
              startTime: { lt: event.endTime },
              endTime: { gt: event.startTime },
            },
          },
          include: { event: { select: { id: true, title: true } } },
        });
        conflicts.push(
          ...overlapping.map((a) => ({
            eventId: a.event.id,
            title: a.event.title,
          })),
        );
      }
    }

    return {
      attendanceRate: scores.attendanceRate,
      unavailableDates,
      absenceReasons: recentAbsences.map((a) => a.reasonCategory ?? ''),
      conflicts,
    };
  }

  async getScoreTrends(memberId: string, months = 6) {
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Member not found');

    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const records = await this.prisma.attendance.findMany({
      where: { memberId, createdAt: { gte: since } },
      select: {
        physicalStatus: true,
        reasonCategory: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const buckets = new Map<string, { total: number; present: number; excused: number }>();

    for (const r of records) {
      const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const b = buckets.get(key) ?? { total: 0, present: 0, excused: 0 };
      b.total++;
      if (r.physicalStatus === 'PRESENT' || r.physicalStatus === 'LATE') {
        b.present++;
      }
      if (r.physicalStatus === 'ABSENT' && r.reasonCategory === 'EXCUSED') {
        b.excused++;
      }
      buckets.set(key, b);
    }

    const trends = [...buckets.entries()].map(([period, b]) => ({
      period,
      totalEvents: b.total,
      attendanceRate: b.total
        ? Math.round((b.present / b.total) * 10000) / 100
        : 0,
      responsibilityScore: b.total
        ? Math.round(((b.present + b.excused) / b.total) * 10000) / 100
        : 0,
    }));

    return { memberId, months, trends };
  }
}
