import { PERMISSIONS } from '../common/constants/roles';

import {

  hasChoirOperations,

  hasEffectivePermission,

  hasProtocolCoordination,

  hasProtocolOversight,

  hasProtocolTeamHeadAuthority,

} from '../common/governance/governance-permissions.util';



export type DashboardWidgetCategory =

  | 'overview'

  | 'attendance'

  | 'operations'

  | 'finance'

  | 'discipline'

  | 'communications'

  | 'analytics'

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

    permissions: [

      PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,

      PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,

      PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,

      PERMISSIONS.CHOIR_OVERSIGHT,

      PERMISSIONS.REPORT_EXPORT,

    ],

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

    id: 'upcomingEvents',

    category: 'operations',

    priority: 40,

    permissions: [PERMISSIONS.EVENT_READ, PERMISSIONS.EVENT_WRITE],

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

    id: 'replacementMix',

    category: 'operations',

    priority: 55,

    permissions: [PERMISSIONS.SWAP_MANAGE, PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE],

    anyOf: true,

  },

  {

    id: 'treasurerPanel',

    category: 'finance',

    priority: 60,

    permissions: [

      PERMISSIONS.FINANCE_VIEW_SCOPE,

      PERMISSIONS.FINANCE_READ,

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

    permissions: [PERMISSIONS.EVENT_WRITE],

  },

  {

    id: 'operationsManagerPanel',

    category: 'operations',

    priority: 75,

    permissions: [

      PERMISSIONS.CHOIR_EVENTS_MANAGE_SCOPE,

      PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,

      PERMISSIONS.EVENT_WRITE,

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

      PERMISSIONS.FINANCE_READ,

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

    permissions: [PERMISSIONS.AUDIT_READ],

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

  { id: 'systemKpis', category: 'admin', priority: 10, permissions: [PERMISSIONS.AUDIT_READ] },

  { id: 'systemHealth', category: 'admin', priority: 20, permissions: [PERMISSIONS.AUDIT_READ] },

  { id: 'auditTrend', category: 'admin', priority: 30, permissions: [PERMISSIONS.AUDIT_READ] },

  { id: 'roleDistribution', category: 'admin', priority: 40, permissions: [PERMISSIONS.AUDIT_READ] },

  { id: 'syncDiagnostics', category: 'admin', priority: 50, permissions: [PERMISSIONS.SYNC_ADMIN, PERMISSIONS.AUDIT_READ], anyOf: true },

  { id: 'attendanceWeights', category: 'admin', priority: 55, permissions: [PERMISSIONS.SYNC_ADMIN] },

  { id: 'governanceAnalytics', category: 'analytics', priority: 60, permissions: [PERMISSIONS.AUDIT_READ] },

  { id: 'auditActivity', category: 'admin', priority: 70, permissions: [PERMISSIONS.AUDIT_READ] },

  { id: 'alertsPanel', category: 'admin', priority: 15, permissions: [PERMISSIONS.AUDIT_READ] },

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

    protocolCoordinator: has('protocolCoordinatorPanel'),

    protocolPresident: has('protocolPresidentPanel'),

    protocolTeamHead: has('protocolTeamHeadPanel'),

    choirLeader: has('choirLeaderPanel'),

    teamHead: hasProtocolTeamHeadAuthority(permissions),

    replacements: hasEffectivePermission(permissions, PERMISSIONS.SWAP_MANAGE),

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

    auditInsights: hasEffectivePermission(permissions, PERMISSIONS.AUDIT_READ),

  };

}


