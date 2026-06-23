/** Platform UI capabilities — legacy permission bridge until scoped capabilities ship. */
export type PlatformUiCapabilityDefinition = {
  id: string;
  label: string;
  requireAnyOf: readonly string[];
  mode?: 'any' | 'all';
};

export const PLATFORM_UI_CAPABILITY_REGISTRY: PlatformUiCapabilityDefinition[] = [
  // Protocol
  {
    id: 'protocol-contribution-adjust',
    label: 'Protocol contribution adjust',
    requireAnyOf: ['protocol.contribution.adjust', 'protocol.finance.manage'],
  },
  {
    id: 'protocol-finance-approve',
    label: 'Protocol finance approve',
    requireAnyOf: ['protocol.finance.approve', 'protocol.finance.manage'],
  },
  {
    id: 'protocol-contribution-treasury-view',
    label: 'Protocol contribution treasury view',
    requireAnyOf: [
      'protocol.contribution.view.all',
      'protocol.finance.view',
      'protocol.finance.manage',
      'protocol.finance.approve',
    ],
  },
  {
    id: 'protocol-team-manage',
    label: 'Protocol team manage',
    requireAnyOf: ['protocol.team.manage', 'protocol.manage'],
  },
  {
    id: 'protocol-claims-review',
    label: 'Protocol claims review',
    requireAnyOf: ['protocol.claim.review', 'protocol.manage'],
  },
  {
    id: 'protocol-admin-hub',
    label: 'Protocol admin hub',
    requireAnyOf: [
      'committee.member.manage',
      'protocol.invite',
      'protocol.claim.review',
      'protocol.manage',
    ],
  },
  {
    id: 'protocol-manage',
    label: 'Protocol manage',
    requireAnyOf: ['protocol.manage'],
  },
  {
    id: 'protocol-invite',
    label: 'Protocol invite',
    requireAnyOf: ['protocol.invite', 'protocol.manage'],
  },
  {
    id: 'protocol-team-leader-manage',
    label: 'Protocol team leader manage',
    requireAnyOf: ['protocol.team.leader.manage'],
  },
  {
    id: 'protocol-committee-member-manage',
    label: 'Protocol committee member manage',
    requireAnyOf: ['committee.member.manage', 'protocol.manage'],
  },
  {
    id: 'protocol-committee-role-manage',
    label: 'Protocol committee role manage',
    requireAnyOf: ['committee.role.manage'],
  },
  {
    id: 'protocol-team-approve-publish',
    label: 'Protocol team approve/publish',
    requireAnyOf: [
      'protocol.team.approve',
      'protocol.team.publish',
      'protocol.team.manage',
      'protocol.manage',
    ],
  },
  {
    id: 'protocol-team-leadership',
    label: 'Protocol team leadership',
    requireAnyOf: ['protocol.manage', 'protocol.team.manage', 'protocol.team.leader.manage'],
  },
  {
    id: 'protocol-attendance-manage',
    label: 'Protocol attendance manage',
    requireAnyOf: [
      'protocol.attendance.manage',
      'protocol.team.leader.execute',
      'protocol.team.head',
      'attendance.mark',
    ],
  },
  {
    id: 'protocol-replacement-manage',
    label: 'Protocol replacement manage',
    requireAnyOf: [
      'protocol.replacement.manage',
      'protocol.team.head',
      'protocol.team.leader.execute',
    ],
  },
  {
    id: 'protocol-report',
    label: 'Protocol report',
    requireAnyOf: ['protocol.report'],
  },
  {
    id: 'protocol-report-team-ops',
    label: 'Protocol report team ops',
    requireAnyOf: [
      'protocol.report',
      'protocol.team.leader.execute',
      'protocol.team.head',
      'protocol.team.manage',
    ],
  },
  {
    id: 'protocol-rankings-oversight',
    label: 'Protocol rankings oversight',
    requireAnyOf: [
      'protocol.manage',
      'protocol.operational.monitor',
      'protocol.oversight',
      'protocol.team.manage',
    ],
  },
  {
    id: 'protocol-treasury-export',
    label: 'Protocol treasury export',
    requireAnyOf: ['protocol.finance.view', 'protocol.finance.manage', 'protocol.finance.approve'],
  },
  {
    id: 'protocol-admin-settings',
    label: 'Protocol admin settings',
    requireAnyOf: ['protocol.manage', 'committee.member.manage'],
  },
  // Church
  {
    id: 'church-facility-manage',
    label: 'Church facility manage',
    requireAnyOf: ['church.facility.manage'],
  },
  {
    id: 'church-schedule-submit',
    label: 'Church schedule submit',
    requireAnyOf: ['church.schedule.submit'],
  },
  {
    id: 'church-schedule-view-queue',
    label: 'Church schedule view queue',
    requireAnyOf: ['church.schedule.view.queue'],
  },
  {
    id: 'church-schedule-manage',
    label: 'Church schedule manage',
    requireAnyOf: ['church.schedule.manage'],
  },
  {
    id: 'church-schedule-resolve',
    label: 'Church schedule resolve',
    requireAnyOf: ['church.schedule.resolve'],
  },
  {
    id: 'church-governance-manage',
    label: 'Church governance manage',
    requireAnyOf: ['church.governance.manage'],
  },
  {
    id: 'church-service-request-schedule',
    label: 'Church service request schedule',
    requireAnyOf: ['choir.ops.schedule', 'choir.ops.manage', 'church.governance.manage'],
  },
  {
    id: 'church-service-request-create',
    label: 'Church service request create',
    requireAnyOf: ['church.governance.manage', 'operations:manage'],
  },
  {
    id: 'church-announcements-manage',
    label: 'Church announcements manage',
    requireAnyOf: [
      'ministry.announcement.manage',
      'ministry.manage',
      'church.intelligence.manage',
    ],
  },
  // Ministry
  {
    id: 'ministry-announcement-manage',
    label: 'Ministry announcement manage',
    requireAnyOf: ['ministry.announcement.manage'],
  },
  {
    id: 'ministry-settings-manage',
    label: 'Ministry settings manage',
    requireAnyOf: ['ministry.settings.manage'],
  },
  // Admin / system
  {
    id: 'admin-import',
    label: 'Admin import',
    requireAnyOf: ['pilot.import.manage', 'admin.users.manage'],
  },
  {
    id: 'admin-users-manage',
    label: 'Admin users manage',
    requireAnyOf: ['admin.users.manage'],
  },
  {
    id: 'admin-settings-manage',
    label: 'Admin settings manage',
    requireAnyOf: ['admin.settings.manage', 'admin.settings.*'],
  },
  {
    id: 'admin-roles-manage',
    label: 'Admin roles manage',
    requireAnyOf: ['admin.roles.manage'],
  },
  {
    id: 'admin-audit-view',
    label: 'Admin audit view',
    requireAnyOf: ['admin.audit.view'],
  },
  {
    id: 'admin-sync-manage',
    label: 'Admin sync manage',
    requireAnyOf: ['admin.sync.manage'],
  },
  // Members
  {
    id: 'member-manage',
    label: 'Member manage',
    requireAnyOf: ['member:manage'],
  },
  {
    id: 'report-export',
    label: 'Report export',
    requireAnyOf: ['report:export'],
  },
];

export function platformUiCapabilityVisible(
  uiId: string,
  effectivePermissions: string[],
): boolean {
  const def = PLATFORM_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((p) => effectivePermissions.includes(p));
  }
  return def.requireAnyOf.some((p) => effectivePermissions.includes(p));
}

export function isPlatformUiCapability(uiId: string): boolean {
  return PLATFORM_UI_CAPABILITY_REGISTRY.some((d) => d.id === uiId);
}

/** Map legacy single permission strings to platform UI capability ids. */
export const PLATFORM_PERMISSION_TO_UI: Record<string, string> = {
  'admin.settings.manage': 'admin-settings-manage',
  'admin.users.manage': 'admin-users-manage',
  'admin.roles.manage': 'admin-roles-manage',
  'admin.audit.view': 'admin-audit-view',
  'admin.sync.manage': 'admin-sync-manage',
  'admin.settings.*': 'admin-settings-manage',
};
