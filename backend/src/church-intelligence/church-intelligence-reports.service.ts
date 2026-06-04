import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from '../reports/reports.service';
import { AuditService } from '../audit/audit.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import { ChurchHealthService } from './church-health.service';
import { MinistryHealthService } from './ministry-health.service';
import { OperationalUnitHealthService } from './operational-unit-health.service';
import { GovernanceAlertsService } from './governance-alerts.service';
import { LeadershipAnalyticsService } from './leadership-analytics.service';
import { ChurchActivityService } from './church-activity.service';
import { PilotReadinessService } from '../pilot-ready/pilot-readiness.service';
import {
  assertChurchReportsExport,
  assertChurchReportsView,
} from './church-intelligence.util';
import {
  CHURCH_INTELLIGENCE_AUDIT,
  CHURCH_INTELLIGENCE_AUDIT_ENTITY,
} from './church-intelligence.constants';

export type ChurchReportType =
  | 'ministry-health'
  | 'unit-health'
  | 'leadership-activity'
  | 'governance-alerts'
  | 'church-activity'
  | 'growth-summary';

@Injectable()
export class ChurchIntelligenceReportsService {
  constructor(
    private access: MinistryAccessService,
    private health: ChurchHealthService,
    private ministryHealth: MinistryHealthService,
    private unitHealth: OperationalUnitHealthService,
    private alerts: GovernanceAlertsService,
    private leadership: LeadershipAnalyticsService,
    private activity: ChurchActivityService,
    private reports: ReportsService,
    private audit: AuditService,
  ) {}

  async listReports(actorUserId: string) {
    await assertChurchReportsView(this.access, actorUserId);
    return [
      { id: 'ministry-health', title: 'Ministry Health', formats: ['csv', 'pdf'] },
      { id: 'unit-health', title: 'Operational Unit Health', formats: ['csv', 'pdf'] },
      { id: 'leadership-activity', title: 'Leadership Activity', formats: ['csv', 'pdf'] },
      { id: 'governance-alerts', title: 'Governance Alerts', formats: ['csv', 'pdf'] },
      { id: 'church-activity', title: 'Church Activity', formats: ['csv', 'pdf'] },
      { id: 'growth-summary', title: 'Growth Summary', formats: ['csv', 'pdf'] },
    ];
  }

  async generate(actorUserId: string, reportType: ChurchReportType) {
    await assertChurchReportsView(this.access, actorUserId);
    switch (reportType) {
      case 'ministry-health':
        return this.ministryHealth.scoreAll(actorUserId);
      case 'unit-health':
        return this.unitHealth.scoreAll(actorUserId);
      case 'leadership-activity':
        return this.leadership.list(actorUserId);
      case 'governance-alerts':
        return this.alerts.list(actorUserId);
      case 'church-activity':
        return this.activity.feed(actorUserId, { limit: 100 });
      case 'growth-summary':
        return this.growthSummary(actorUserId);
      default:
        return [];
    }
  }

  async exportCsv(
    actorUserId: string,
    reportType: ChurchReportType,
    res: Response,
  ) {
    await assertChurchReportsExport(this.access, actorUserId);
    const data = await this.generate(actorUserId, reportType);
    const rows = Array.isArray(data) ? data : [data];
    const header = rows.length ? Object.keys(rows[0] as object).join(',') : 'data';
    const body = rows
      .map((row) =>
        Object.values(row as object)
          .map((v) => JSON.stringify(v ?? ''))
          .join(','),
      )
      .join('\n');
    await this.auditReport(actorUserId, reportType, 'csv');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${reportType}.csv"`,
    );
    res.send(`${header}\n${body}`);
  }

  async exportPdf(
    actorUserId: string,
    reportType: ChurchReportType,
    res: Response,
  ) {
    await assertChurchReportsExport(this.access, actorUserId);
    const data = await this.generate(actorUserId, reportType);
    const lines = JSON.stringify(data, null, 2).split('\n').slice(0, 60);
    const buffer = await this.reports.exportPdf(
      reportType.replace(/-/g, ' '),
      lines,
    );
    await this.auditReport(actorUserId, reportType, 'pdf');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${reportType}.pdf"`,
    );
    res.send(buffer);
  }

  private async growthSummary(actorUserId: string) {
    const [summary, ministryScores] = await Promise.all([
      this.health.summary(actorUserId),
      this.ministryHealth.scoreAll(actorUserId),
    ]);
    return {
      summary,
      growingMinistries: ministryScores.filter((m) => m.growthTrend === 'up'),
      decliningMinistries: ministryScores.filter((m) => m.growthTrend === 'down'),
      healthDistribution: ministryScores.reduce<Record<string, number>>(
        (acc, m) => {
          acc[m.status] = (acc[m.status] ?? 0) + 1;
          return acc;
        },
        {},
      ),
    };
  }

  private async auditReport(
    actorUserId: string,
    reportType: string,
    format: string,
  ) {
    await this.audit.log({
      userId: actorUserId,
      action: CHURCH_INTELLIGENCE_AUDIT.REPORT_GENERATED,
      entity: CHURCH_INTELLIGENCE_AUDIT_ENTITY.CHURCH,
      entityId: reportType,
      newValue: { format },
    });
  }
}

@Injectable()
export class ChurchIntelligenceDashboardService {
  constructor(
    private health: ChurchHealthService,
    private ministryHealth: MinistryHealthService,
    private unitHealth: OperationalUnitHealthService,
    private alerts: GovernanceAlertsService,
    private activity: ChurchActivityService,
    private leadership: LeadershipAnalyticsService,
    private pilotReadiness: PilotReadinessService,
  ) {}

  async widgetBundle(actorUserId: string) {
    try {
      const [
        summary,
        ministryHealth,
        unitHealth,
        alerts,
        activity,
        leadership,
        pilotReadiness,
      ] = await Promise.all([
        this.health.summary(actorUserId),
        this.ministryHealth.scoreAll(actorUserId),
        this.unitHealth.scoreAll(actorUserId),
        this.alerts.list(actorUserId),
        this.activity.feed(actorUserId, { limit: 8 }),
        this.leadership.list(actorUserId),
        this.pilotReadiness.indicators(actorUserId).catch(() => null),
      ]);
      return {
        summary,
        ministryHealth: ministryHealth.slice(0, 5),
        unitHealth: unitHealth.slice(0, 5),
        alerts: alerts.slice(0, 5),
        recentActivity: activity,
        leadership: leadership.slice(0, 5),
        pilotReadiness,
      };
    } catch {
      return null;
    }
  }
}
