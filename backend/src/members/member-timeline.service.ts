import { Injectable } from '@nestjs/common';

import {

  ContributionStatus,

  EventStatus,

  WelfareCaseStatus,

} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { AttendanceScoringService } from '../attendance/attendance-scoring.service';

import { ContributionEffectiveAmountService } from '../finance/contribution-effective-amount.service';

import { MemberProfileAccessService } from './member-profile-access.service';



export type MemberTimelineEventType =

  | 'attendance'

  | 'contribution'

  | 'welfare_case'

  | 'welfare_contribution'

  | 'welfare_assistance'

  | 'leadership'

  | 'discipline'

  | 'rehearsal'

  | 'assignment'

  | 'status_change'

  | 'announcement';



export interface MemberTimelineEvent {

  type: MemberTimelineEventType;

  timestamp: string;

  title: string;

  summary: string;

  metadata?: Record<string, unknown>;

}



@Injectable()

export class MemberTimelineService {

  constructor(

    private prisma: PrismaService,

    private access: MemberProfileAccessService,

    private attendanceScoring: AttendanceScoringService,

    private effective: ContributionEffectiveAmountService,

  ) {}



  async getTimeline(actorUserId: string, memberId: string, limit = 100) {

    const { member, permissions, isSelf, actorMemberId } =

      await this.access.assertCanViewMemberProfile(actorUserId, memberId);



    const take = Math.min(Math.max(Number(limit) || 100, 1), 200);

    const showWelfare = this.access.canViewWelfareDetails(permissions, isSelf);

    const showDiscipline = this.access.canViewDisciplineDetails(

      permissions,

      isSelf,

    );

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

    const showAttendance = await this.access.canViewAttendanceDetail(

      permissions,

      isSelf,

      actorMemberId,

      memberId,

    );



    const events: MemberTimelineEvent[] = [];



    const statusHistory = await this.prisma.memberStatusHistory.findMany({

      where: { memberId },

      orderBy: { createdAt: 'desc' },

      take: 50,

    });

    for (const row of statusHistory) {

      events.push({

        type: 'status_change',

        timestamp: row.createdAt.toISOString(),

        title: 'Membership status',

        summary: row.fromStatus

          ? `${row.fromStatus} → ${row.toStatus}`

          : row.toStatus,

        metadata: { reason: row.reason, historyId: row.id },

      });

    }



    if (showAttendance) {

      const attendance = await this.prisma.attendance.findMany({

        where: { memberId },

        include: {

          event: { select: { title: true, type: true, startTime: true } },

        },

        orderBy: { createdAt: 'desc' },

        take: 80,

      });

      for (const row of attendance) {

        events.push({

          type: 'attendance',

          timestamp: (row.event?.startTime ?? row.createdAt).toISOString(),

          title: row.event?.title ?? 'Attendance',

          summary: `${row.operationalStatus} (${row.physicalStatus})`,

          metadata: { eventId: row.eventId, eventType: row.event?.type },

        });

      }

    }



    if (showContributions) {

      const contributions = await this.prisma.contributionRecord.findMany({

        where: { memberId },

        include: {

          adjustments: { select: { adjustmentAmount: true } },

          contributionTypeCatalog: { select: { name: true } },

        },

        orderBy: { createdAt: 'desc' },

        take: 80,

      });

      for (const row of contributions) {

        const amount =

          row.status === ContributionStatus.CONFIRMED

            ? this.effective.computeFromRow(row)

            : Number(row.claimedAmount ?? row.amount);

        events.push({

          type: 'contribution',

          timestamp: (row.paymentAt ?? row.createdAt).toISOString(),

          title: row.referenceNumber,

          summary: `${row.status} — ${row.contributionTypeCatalog?.name ?? 'Contribution'} (${amount})`,

          metadata: {

            contributionId: row.id,

            status: row.status,

            amount,

          },

        });

      }

    }



    if (showWelfare) {

      const cases = await this.prisma.welfareCase.findMany({

        where: { memberId },

        include: { category: true },

        orderBy: { updatedAt: 'desc' },

        take: 40,

      });

      for (const row of cases) {

        events.push({

          type: 'welfare_case',

          timestamp: row.updatedAt.toISOString(),

          title: row.title,

          summary: `${row.category.name} — ${row.status}`,

          metadata: { caseId: row.id, urgency: row.urgency },

        });

      }



      const welfareContribs = await this.prisma.welfareContribution.findMany({

        where: { contributorId: memberId },

        orderBy: { paymentAt: 'desc' },

        take: 40,

      });

      for (const row of welfareContribs) {

        events.push({

          type: 'welfare_contribution',

          timestamp: row.paymentAt.toISOString(),

          title: 'Welfare contribution',

          summary: `${Number(row.amount)} ${row.currency}`,

          metadata: { contributionId: row.id, caseId: row.caseId },

        });

      }



      const assistance = await this.prisma.welfareAssistance.findMany({

        where: { case: { memberId } },

        orderBy: { deliveredAt: 'desc' },

        take: 40,

      });

      for (const row of assistance) {

        events.push({

          type: 'welfare_assistance',

          timestamp: row.deliveredAt.toISOString(),

          title: 'Welfare assistance',

          summary: `${row.assistanceType}: ${row.description}`,

          metadata: { assistanceId: row.id, caseId: row.caseId },

        });

      }

    }



    const leadership = await this.prisma.familyLeadershipHistory.findMany({

      where: { memberId },

      orderBy: { startedAt: 'desc' },

      take: 30,

    });

    for (const row of leadership) {

      events.push({

        type: 'leadership',

        timestamp: row.startedAt.toISOString(),

        title: 'Family leadership',

        summary: row.endedAt

          ? `${row.role} (ended ${row.endedAt.toISOString().slice(0, 10)})`

          : `${row.role} (current)`,

        metadata: { familyId: row.familyId, role: row.role },

      });

    }



    const committee = await this.prisma.choirCommitteeMember.findMany({

      where: { memberId },

      include: { role: { select: { name: true } } },

      orderBy: { assignedAt: 'desc' },

      take: 20,

    });

    for (const row of committee) {

      events.push({

        type: 'leadership',

        timestamp: row.assignedAt.toISOString(),

        title: 'Choir committee',

        summary: row.role.name,

        metadata: { roleId: row.roleId, choirId: row.choirId },

      });

    }



    if (showDiscipline) {

      const discipline = await this.prisma.disciplineCase.findMany({

        where: { memberId },

        orderBy: { updatedAt: 'desc' },

        take: 30,

      });

      for (const row of discipline) {

        events.push({

          type: 'discipline',

          timestamp: row.updatedAt.toISOString(),

          title: row.title,

          summary: row.stage,

          metadata: { caseId: row.id },

        });

      }

    }



    const assignments = await this.prisma.eventAssignment.findMany({

      where: { memberId },

      include: {

        event: {

          select: {

            id: true,

            title: true,

            type: true,

            startTime: true,

            status: true,

          },

        },

      },

      orderBy: { createdAt: 'desc' },

      take: 60,

    });

    for (const row of assignments) {

      if (!row.event) continue;

      const isRehearsal = row.event.type === 'REHEARSAL';

      events.push({

        type: isRehearsal ? 'rehearsal' : 'assignment',

        timestamp: row.event.startTime.toISOString(),

        title: row.event.title,

        summary: row.event.status,

        metadata: { eventId: row.event.id, eventType: row.event.type },

      });

    }



    if (member.user?.id) {

      const reads = await this.prisma.choirAnnouncementRead.findMany({

        where: { userId: member.user.id },

        include: {

          announcement: {

            select: { title: true, publishedAt: true, audience: true },

          },

        },

        orderBy: { readAt: 'desc' },

        take: 30,

      });

      for (const row of reads) {

        if (!row.announcement) continue;

        events.push({

          type: 'announcement',

          timestamp: (

            row.announcement.publishedAt ?? row.readAt

          ).toISOString(),

          title: row.announcement.title,

          summary: row.acknowledged ? 'Acknowledged' : 'Read',

          metadata: {

            announcementId: row.announcementId,

            audience: row.announcement.audience,

          },

        });

      }

    }



    const sorted = events

      .sort(

        (a, b) =>

          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),

      )

      .slice(0, take);



    const score = await this.attendanceScoring.scoreMember(memberId);



    return {

      memberId,

      memberName: `${member.firstName} ${member.lastName}`.trim(),

      attendanceScore: score,

      events: sorted,

    };

  }

}


