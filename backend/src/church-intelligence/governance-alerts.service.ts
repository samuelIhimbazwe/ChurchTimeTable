import { Injectable } from '@nestjs/common';
import { GovernanceAlertType, MinistryHealthStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import { MinistryHealthService } from './ministry-health.service';
import { OperationalUnitHealthService } from './operational-unit-health.service';
import type { GovernanceAlert } from './church-intelligence.types';
import { AuditService } from '../audit/audit.service';
import {
  CHURCH_INTELLIGENCE_AUDIT,
  CHURCH_INTELLIGENCE_AUDIT_ENTITY,
} from './church-intelligence.constants';

@Injectable()
export class GovernanceAlertsService {
  constructor(
    private prisma: PrismaService,
    private ministryAccess: MinistryAccessService,
    private ministryHealth: MinistryHealthService,
    private unitHealth: OperationalUnitHealthService,
    private audit: AuditService,
  ) {}

  async list(actorUserId: string): Promise<GovernanceAlert[]> {
    const alerts: GovernanceAlert[] = [];
    const visible = await this.ministryAccess.ministryIdsVisibleTo(actorUserId);
    const ministryWhere = visible === null ? {} : { id: { in: visible } };
    const since60 = new Date();
    since60.setDate(since60.getDate() - 60);
    const since90 = new Date();
    since90.setDate(since90.getDate() - 90);
    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);

    const ministries = await this.prisma.ministry.findMany({
      where: ministryWhere,
      include: { settings: true },
    });

    for (const ministry of ministries) {
      const [leaders, meetings, activities, budgets] = await Promise.all([
        this.prisma.ministryLeadershipAssignment.count({
          where: { ministryId: ministry.id, endedAt: null },
        }),
        this.prisma.ministryMeeting.count({
          where: {
            ministryId: ministry.id,
            scheduledAt: { gte: since60 },
          },
        }),
        this.prisma.ministryActivity.count({
          where: { ministryId: ministry.id, createdAt: { gte: since30 } },
        }),
        ministry.settings?.allowFinance !== false
          ? this.prisma.ministryBudget.count({
              where: { ministryId: ministry.id, status: 'ACTIVE' },
            })
          : Promise.resolve(1),
      ]);

      if (leaders === 0) {
        alerts.push({
          id: `no-leadership-${ministry.id}`,
          type: GovernanceAlertType.NO_LEADERSHIP,
          severity: 'critical',
          title: 'No active leadership',
          message: `${ministry.name} has no assigned leaders.`,
          ministryId: ministry.id,
          ministryName: ministry.name,
          actionHint: 'Assign ministry leadership positions.',
        });
      }

      if (meetings === 0 && ministry.isActive) {
        alerts.push({
          id: `no-meetings-${ministry.id}`,
          type: GovernanceAlertType.NO_MEETINGS,
          severity: 'warning',
          title: 'No recent meetings',
          message: `${ministry.name} has held no meetings in the last 60 days.`,
          ministryId: ministry.id,
          ministryName: ministry.name,
          actionHint: 'Schedule a ministry meeting.',
        });
      }

      if (activities === 0 && ministry.isActive) {
        alerts.push({
          id: `no-activity-${ministry.id}`,
          type: GovernanceAlertType.NO_ACTIVITY,
          severity: 'warning',
          title: 'No recent activity',
          message: `${ministry.name} has no recorded activity in 30 days.`,
          ministryId: ministry.id,
          ministryName: ministry.name,
        });
      }

      if (budgets === 0 && ministry.settings?.allowFinance !== false) {
        alerts.push({
          id: `budget-inactive-${ministry.id}`,
          type: GovernanceAlertType.BUDGET_INACTIVE,
          severity: 'info',
          title: 'No active budget',
          message: `${ministry.name} has finance enabled but no active budget.`,
          ministryId: ministry.id,
          ministryName: ministry.name,
        });
      }

      const docs = await this.prisma.ministryDocument.count({
        where: {
          ministryId: ministry.id,
          createdAt: { gte: since90 },
        },
      });
      if (docs === 0 && ministry.isActive) {
        alerts.push({
          id: `no-reports-${ministry.id}`,
          type: GovernanceAlertType.NO_REPORTS,
          severity: 'info',
          title: 'No recent reports or documents',
          message: `${ministry.name} has no documents uploaded in 90 days.`,
          ministryId: ministry.id,
          ministryName: ministry.name,
        });
      }
    }

    const healthScores = await this.ministryHealth.scoreAll(actorUserId);
    for (const score of healthScores) {
      if (score.engagementScore < 40 && score.status !== MinistryHealthStatus.INACTIVE) {
        alerts.push({
          id: `low-engagement-${score.ministryId}`,
          type: GovernanceAlertType.LOW_ENGAGEMENT,
          severity: 'warning',
          title: 'Low engagement',
          message: `${score.ministryName} engagement score is ${score.engagementScore}.`,
          ministryId: score.ministryId,
          ministryName: score.ministryName,
        });
      }
    }

    const unitScores = await this.unitHealth.scoreAll(actorUserId);
    for (const unit of unitScores) {
      if (unit.status === MinistryHealthStatus.INACTIVE || unit.memberCount === 0) {
        alerts.push({
          id: `inactive-unit-${unit.operationalUnitId}`,
          type: GovernanceAlertType.INACTIVE_UNIT,
          severity: 'warning',
          title: 'Inactive operational unit',
          message: `${unit.operationalUnitName} has no active members.`,
          ministryId: unit.ministryId,
          ministryName: unit.ministryName,
          operationalUnitId: unit.operationalUnitId,
          operationalUnitName: unit.operationalUnitName,
        });
      }
    }

    const overdueTerms = await this.prisma.leadershipTerm.findMany({
      where: {
        endedAt: null,
        expectedEndAt: { lt: new Date() },
      },
    });
    for (const term of overdueTerms) {
      alerts.push({
        id: `succession-${term.id}`,
        type: GovernanceAlertType.MISSING_SUCCESSION,
        severity: 'critical',
        title: 'Leadership term overdue',
        message: 'A leadership assignment has passed its expected end date.',
        actionHint: 'Review succession planning for this role.',
      });
    }

    const sorted = alerts.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    });

    await this.audit.log({
      userId: actorUserId,
      action: CHURCH_INTELLIGENCE_AUDIT.ALERTS_GENERATED,
      entity: CHURCH_INTELLIGENCE_AUDIT_ENTITY.CHURCH,
      entityId: 'church',
      newValue: { count: sorted.length },
    });

    return sorted;
  }
}
