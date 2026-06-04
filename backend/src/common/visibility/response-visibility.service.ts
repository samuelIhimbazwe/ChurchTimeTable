import { Injectable } from '@nestjs/common';
import {
  canViewAdminAudit,
  canViewDisciplineIntelligence,
  canViewFinanceIntelligence,
} from '../governance/governance-permissions.util';
import type { MinistryAlert } from '../../dashboard/ministry-intelligence.service';

const FINANCE_WIDGET_IDS = new Set([
  'treasurerPanel',
  'financeSnapshot',
  'financeStewardshipPanel',
]);

const ADMIN_WIDGET_IDS = new Set(['auditActivity']);

const DISCIPLINE_WIDGET_IDS = new Set(['disciplinePanel']);

@Injectable()
export class ResponseVisibilityService {
  filterLeaderSummary<T extends Record<string, unknown>>(
    payload: T,
    permissions: string[],
  ): T {
    const result = { ...payload } as Record<string, unknown>;
    const canFinance = canViewFinanceIntelligence(permissions);
    const canDiscipline = canViewDisciplineIntelligence(permissions);
    const canAudit = canViewAdminAudit(permissions);

    if (!canFinance) {
      delete result.financeSummary;
    }

    if (!canDiscipline) {
      delete result.activeDiscipline;
    }

    if (!canAudit) {
      delete result.recentAudit;
    }

    if (result.intelligence && typeof result.intelligence === 'object') {
      const intelligence = {
        ...(result.intelligence as Record<string, unknown>),
      };
      if (!canFinance) {
        delete intelligence.financeAnalytics;
      }
      if (!canDiscipline) {
        delete intelligence.disciplineAnalytics;
      }
      result.intelligence = intelligence;
    }

    if (Array.isArray(result.widgets)) {
      result.widgets = result.widgets.filter((widget) => {
        if (!widget || typeof widget !== 'object') return true;
        const id = (widget as { id?: string }).id;
        if (!canFinance && id && FINANCE_WIDGET_IDS.has(id)) return false;
        if (!canDiscipline && id && DISCIPLINE_WIDGET_IDS.has(id)) return false;
        if (!canAudit && id && ADMIN_WIDGET_IDS.has(id)) return false;
        if (id === 'financeSnapshot' && !result.financeSummary) return false;
        if (id === 'financeStewardshipPanel' && !canFinance) return false;
        return true;
      });
    }

    if (Array.isArray(result.alerts)) {
      result.alerts = this.filterAlerts(
        result.alerts as MinistryAlert[],
        permissions,
      );
    }

    return result as T;
  }

  filterIntelligenceSummary<T extends Record<string, unknown>>(
    payload: T,
    permissions: string[],
  ): T {
    const result = { ...payload } as Record<string, unknown>;
    const canFinance = canViewFinanceIntelligence(permissions);
    const canDiscipline = canViewDisciplineIntelligence(permissions);

    if (!canFinance) {
      delete result.financeAnalytics;
    }
    if (!canDiscipline) {
      delete result.disciplineAnalytics;
    }
    if (Array.isArray(result.alerts)) {
      result.alerts = this.filterAlerts(
        result.alerts as MinistryAlert[],
        permissions,
      );
    }
    return result as T;
  }

  filterMemberSummary<T extends Record<string, unknown>>(
    payload: T,
    permissions: string[],
  ): T {
    const result = { ...payload } as Record<string, unknown>;
    if (Array.isArray(result.alerts)) {
      result.alerts = this.filterAlerts(
        result.alerts as MinistryAlert[],
        permissions,
      );
    }
    return result as T;
  }

  filterSearchResponse<
    T extends {
      contributions: unknown[];
    },
  >(payload: T, permissions: string[]): T {
    if (canViewFinanceIntelligence(permissions)) {
      return payload;
    }

    return {
      ...payload,
      contributions: [],
    };
  }

  filterFamilyMetrics<
    T extends {
      contributions: unknown | null;
    },
  >(payload: T, permissions: string[]): T {
    if (canViewFinanceIntelligence(permissions)) {
      return payload;
    }

    return {
      ...payload,
      contributions: null,
    };
  }

  filterAlerts(alerts: MinistryAlert[], permissions: string[]): MinistryAlert[] {
    const canFinance = canViewFinanceIntelligence(permissions);
    const canDiscipline = canViewDisciplineIntelligence(permissions);

    return alerts.filter((alert) => {
      if (alert.type === 'finance_compliance' && !canFinance) return false;
      if (alert.type === 'discipline_review' && !canDiscipline) return false;
      return true;
    });
  }
}
