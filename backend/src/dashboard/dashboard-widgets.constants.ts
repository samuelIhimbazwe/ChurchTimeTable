import { PERMISSIONS } from '../common/constants/roles';

import {
  canViewAdminAudit,
  canManageAdminSync,
  hasChoirOperations,
  hasEffectivePermission,
  hasProtocolCoordination,
  hasProtocolOversight,
  hasProtocolTeamHeadAuthority,
  LEADER_DASHBOARD_ACCESS_CLAIMS,
} from '../common/governance/governance-permissions.util';



export type DashboardWidgetCategory =

  | 'overview'

  | 'attendance'

  | 'operations'

  | 'finance'

  | 'discipline'

  | 'communications'

  | 'analytics'

  | 'operations'

  | 'admin';



export interface DashboardWidgetDefinition {

  id: string;

  category: DashboardWidgetCategory;

  priority: number;

  permissions: string[];

  /** When true, any listed permission grants access; otherwise all are required */

  anyOf?: boolean;

}



/** Permission-driven widget registry — single source of truth for dashboard composition */

export const LEADER_WIDGETS: DashboardWidgetDefinition[] = [

  {

    id: 'kpiOverview',

    category: 'overview',

    priority: 10,

    permissions: [...LEADER_DASHBOARD_ACCESS_CLAIMS],

    anyOf: true,

  },

  {

    id: 'alertsPanel',

    category: 'operations',

    priority: 15,

    permissions: [

      PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,

      PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,

      PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,

      PERMISSIONS.CHOIR_OVERSIGHT,

    ],

    anyOf: true,

  },

  {

    id: 'attendanceTrend',

    category: 'attendance',

    priority: 20,

    permissions: [

      PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,

      PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,

      PERMISSIONS.CHOIR_OVERSIGHT,

    ],

    anyOf: true,

  },

  {

    id: 'ministryIntelligence',

    category: 'analytics',

    priority: 25,

    permissions: [PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE, PERMISSIONS.CHOIR_OVERSIGHT],

    anyOf: true,

  },

  {

    id: 'assetInventory',

    category: 'operations',

    priority: 26,

    permissions: [PERMISSIONS.ASSET_VIEW, PERMISSIONS.ASSET_REPORT],

    anyOf: true,

  },

  {

    id: 'ministryFinance',

    category: 'finance',

    priority: 27,

    permissions: [
      PERMISSIONS.MINISTRY_FINANCE_VIEW,
      PERMISSIONS.MINISTRY_FINANCE_REPORT,
      PERMISSIONS.MINISTRY_FINANCE_OVERSIGHT,
    ],

    anyOf: true,

  },

  {

    id: 'churchHealth',

    category: 'analytics',

    priority: 28,

    permissions: [
      PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
      PERMISSIONS.CHURCH_GOVERNANCE_VIEW,
    ],

    anyOf: true,

  },

  {

    id: 'ministryHealth',

    category: 'analytics',

    priority: 29,

    permissions: [
      PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
      PERMISSIONS.CHURCH_GOVERNANCE_VIEW,
    ],

    anyOf: true,

  },

  {

    id: 'operationalUnitHealth',

    category: 'analytics',

    priority: 30,

    permissions: [
      PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
      PERMISSIONS.CHURCH_GOVERNANCE_VIEW,
    ],

    anyOf: true,

  },

  {

    id: 'governanceAlerts',

    category: 'operations',

    priority: 31,

    permissions: [
      PERMISSIONS.CHURCH_GOVERNANCE_VIEW,
      PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
    ],

    anyOf: true,

  },

  {

    id: 'recentActivity',

    category: 'communications',

    priority: 32,

    permissions: [
      PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
      PERMISSIONS.CHURCH_GOVERNANCE_VIEW,
    ],

    anyOf: true,

  },

  {

    id: 'leadershipActivity',

    category: 'analytics',

    priority: 33,

    permissions: [
      PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
      PERMISSIONS.CHURCH_GOVERNANCE_VIEW,
    ],

    anyOf: true,

  },

  {

    id: 'upcomingOperations',

    category: 'operations',

    priority: 34,

    permissions: [PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_MANAGE],

    anyOf: true,

  },

  {

    id: 'missingAssignments',

    category: 'operations',

    priority: 35,

    permissions: [PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_MANAGE],

    anyOf: true,

  },

  {

    id: 'pendingConfirmations',

    category: 'operations',

    priority: 36,

    permissions: [PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_ASSIGNMENT_CONFIRM],

    anyOf: true,

  },

  {

    id: 'operationsConflicts',

    category: 'operations',

    priority: 37,

    permissions: [PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_MANAGE],

    anyOf: true,

  },

  {

    id: 'protocolOperationsPanel',

    category: 'operations',

    priority: 38,

    permissions: [PERMISSIONS.PROTOCOL_VIEW, PERMISSIONS.PROTOCOL_MANAGE],

    anyOf: true,

  },

  {

    id: 'reliabilityBands',

    category: 'attendance',

    priority: 30,

    permissions: [

      PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,

      PERMISSIONS.CHOIR_OVERSIGHT,

    ],

    anyOf: true,

  },

  {

    id: 'choirLeaderPanel',

    category: 'attendance',

    priority: 45,

    permissions: [

      PERMISSIONS.CHOIR_ATTENDANCE_MANAGE,

      PERMISSIONS.CHOIR_OPERATIONS_MANAGE,

      PERMISSIONS.CHOIR_EVENTS_MANAGE_SCOPE,

    ],

    anyOf: true,

  },

  {

    id: 'upcomingOperations',

    category: 'operations',

    priority: 40,

    permissions: [PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_MANAGE],

    anyOf: true,

  },

  {

    id: 'teamReliability',

    category: 'operations',

    priority: 50,

    permissions: [

      PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,

      PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,

    ],

    anyOf: true,

  },

  {

    id: 'protocolReplacementMix',

    category: 'operations',

    priority: 55,

    permissions: [PERMISSIONS.PROTOCOL_VIEW, PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE],

    anyOf: true,

  },

  {

    id: 'treasurerPanel',

    category: 'finance',

    priority: 60,

    permissions: [

      PERMISSIONS.FINANCE_VIEW_SCOPE,

      PERMISSIONS.PROTOCOL_FINANCE_VIEW,

      PERMISSIONS.CHOIR_FINANCE_VIEW,

    ],

    anyOf: true,

  },

  {

    id: 'disciplinePanel',

    category: 'discipline',

    priority: 65,

    permissions: [PERMISSIONS.DISCIPLINE_REVIEW_SCOPE, PERMISSIONS.DISCIPLINE_MANAGE],

    anyOf: true,

  },

  {

    id: 'secretaryPanel',

    category: 'communications',

    priority: 70,

    permissions: [PERMISSIONS.OPERATIONS_MANAGE],

  },

  {

    id: 'operationsManagerPanel',

    category: 'operations',

    priority: 75,

    permissions: [

      PERMISSIONS.CHOIR_EVENTS_MANAGE_SCOPE,

      PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,

      PERMISSIONS.OPERATIONS_MANAGE,

    ],

    anyOf: true,

  },

  {

    id: 'protocolCoordinatorPanel',

    category: 'operations',

    priority: 80,

    permissions: [

      PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,

      PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,

    ],

    anyOf: true,

  },

  {

    id: 'protocolPresidentPanel',

    category: 'analytics',

    priority: 85,

    permissions: [PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE],

  },

  {

    id: 'protocolTeamHeadPanel',

    category: 'operations',

    priority: 42,

    permissions: [

      PERMISSIONS.PROTOCOL_TEAM_HEAD,

      PERMISSIONS.ATTENDANCE_MARK_SCOPE,

      PERMISSIONS.PROTOCOL_ATTENDANCE_MANAGE,

    ],

    anyOf: true,

  },

  {

    id: 'financeSnapshot',

    category: 'finance',

    priority: 90,

    permissions: [

      PERMISSIONS.FINANCE_VIEW_SCOPE,

      PERMISSIONS.PROTOCOL_FINANCE_VIEW,

      PERMISSIONS.PROTOCOL_FINANCE_MANAGE,

      PERMISSIONS.CHOIR_FINANCE_VIEW,

      PERMISSIONS.CHOIR_FINANCE_MANAGE,

      PERMISSIONS.MINISTRY_FINANCE_OVERSIGHT,

    ],

    anyOf: true,

  },

  {

    id: 'financeStewardshipPanel',

    category: 'finance',

    priority: 92,

    permissions: [

      PERMISSIONS.CHOIR_FINANCE_VIEW,

      PERMISSIONS.CHOIR_FINANCE_MANAGE,

      PERMISSIONS.PROTOCOL_FINANCE_VIEW,

      PERMISSIONS.PROTOCOL_FINANCE_MANAGE,

      PERMISSIONS.MINISTRY_FINANCE_OVERSIGHT,

    ],

    anyOf: true,

  },

  {

    id: 'auditActivity',

    category: 'admin',

    priority: 95,

    permissions: [PERMISSIONS.ADMIN_AUDIT_VIEW],

    anyOf: true,

  },

];



export const MEMBER_WIDGETS: DashboardWidgetDefinition[] = [

  { id: 'kpiOverview', category: 'overview', priority: 10, permissions: [] },

  { id: 'excusePanel', category: 'attendance', priority: 15, permissions: [] },

  { id: 'schedule', category: 'operations', priority: 20, permissions: [] },

  { id: 'notifications', category: 'communications', priority: 30, permissions: [] },

  { id: 'attendanceHistory', category: 'attendance', priority: 40, permissions: [] },

  { id: 'contributionProgress', category: 'finance', priority: 50, permissions: [] },

  { id: 'personalAnalytics', category: 'analytics', priority: 55, permissions: [] },

  { id: 'memberHistory', category: 'analytics', priority: 60, permissions: [] },

  { id: 'alertsPanel', category: 'operations', priority: 12, permissions: [] },

];



export const ADMIN_WIDGETS: DashboardWidgetDefinition[] = [

  { id: 'systemKpis', category: 'admin', priority: 10, permissions: [PERMISSIONS.ADMIN_AUDIT_VIEW], anyOf: true },

  { id: 'systemHealth', category: 'admin', priority: 20, permissions: [PERMISSIONS.ADMIN_SETTINGS_VIEW, PERMISSIONS.ADMIN_SETTINGS_MANAGE], anyOf: true },

  { id: 'auditTrend', category: 'admin', priority: 30, permissions: [PERMISSIONS.ADMIN_AUDIT_VIEW], anyOf: true },

  { id: 'roleDistribution', category: 'admin', priority: 40, permissions: [PERMISSIONS.ADMIN_ROLES_VIEW, PERMISSIONS.ADMIN_ROLES_MANAGE], anyOf: true },

  { id: 'syncDiagnostics', category: 'admin', priority: 50, permissions: [PERMISSIONS.ADMIN_SYNC_MANAGE, PERMISSIONS.ADMIN_AUDIT_VIEW], anyOf: true },

  { id: 'attendanceWeights', category: 'admin', priority: 55, permissions: [PERMISSIONS.ADMIN_SYNC_MANAGE], anyOf: true },

  { id: 'governanceAnalytics', category: 'analytics', priority: 60, permissions: [PERMISSIONS.ADMIN_AUDIT_VIEW], anyOf: true },

  { id: 'auditActivity', category: 'admin', priority: 70, permissions: [PERMISSIONS.ADMIN_AUDIT_VIEW], anyOf: true },

  { id: 'alertsPanel', category: 'admin', priority: 15, permissions: [PERMISSIONS.ADMIN_AUDIT_VIEW], anyOf: true },

];



export function resolveWidgetLayout(

  definitions: DashboardWidgetDefinition[],

  permissions: string[],

): Array<{ id: string; category: DashboardWidgetCategory; priority: number }> {

  const can = (def: DashboardWidgetDefinition) => {

    if (!def.permissions.length) return true;

    if (def.anyOf) {

      return def.permissions.some((p) => hasEffectivePermission(permissions, p));

    }

    return def.permissions.every((p) => hasEffectivePermission(permissions, p));

  };



  return definitions

    .filter(can)

    .map(({ id, category, priority }) => ({ id, category, priority }))

    .sort((a, b) => a.priority - b.priority);

}



/** @deprecated Use widgets[] via resolveWidgetLayout — kept for API compatibility during migration */

export function resolvePermissionFlags(

  permissions: string[],

): Record<string, boolean> {

  const widgets = resolveWidgetLayout(LEADER_WIDGETS, permissions);

  const has = (id: string) => widgets.some((w) => w.id === id);

  return {

    treasurer: has('treasurerPanel'),

    discipline: has('disciplinePanel'),

    secretary: has('secretaryPanel'),

    operationsManager: has('operationsManagerPanel'),

    protocolOperations: has('protocolOperationsPanel'),

    protocolCoordinator: has('protocolCoordinatorPanel'),

    protocolPresident: has('protocolPresidentPanel'),

    protocolTeamHead: has('protocolTeamHeadPanel'),

    choirLeader: has('choirLeaderPanel'),

    teamHead: hasProtocolTeamHeadAuthority(permissions),

    replacements: hasEffectivePermission(permissions, PERMISSIONS.PROTOCOL_VIEW),

    attendanceTools:

      hasProtocolTeamHeadAuthority(permissions) ||

      hasEffectivePermission(permissions, PERMISSIONS.PROTOCOL_ATTENDANCE_MANAGE) ||

      hasEffectivePermission(permissions, PERMISSIONS.CHOIR_ATTENDANCE_MANAGE),

    financeSnapshot: has('financeSnapshot'),

    financeStewardshipPanel: has('financeStewardshipPanel'),

    committeeGovernance:

      hasEffectivePermission(permissions, PERMISSIONS.COMMITTEE_ROLE_MANAGE_SCOPE) ||

      hasEffectivePermission(permissions, PERMISSIONS.COMMITTEE_MEMBER_MANAGE_SCOPE),

    protocolOversight: hasProtocolOversight(permissions),

    protocolCoordinate: hasProtocolCoordination(permissions),

    choirOperations: hasChoirOperations(permissions),

    auditInsights: canViewAdminAudit(permissions),

    platformSyncAdmin: canManageAdminSync(permissions),

  };

}


