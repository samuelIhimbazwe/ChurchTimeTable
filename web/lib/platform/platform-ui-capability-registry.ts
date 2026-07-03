/** Platform UI capabilities — scoped capability ids for choir and protocol. */
export type PlatformUiCapabilityDefinition = {
  id: string;
  label: string;
  requireAnyOf: readonly string[];
  mode?: 'any' | 'all';
};

export const PLATFORM_UI_CAPABILITY_REGISTRY: PlatformUiCapabilityDefinition[] = [
  {
    id: 'protocol-contribution-adjust',
    label: 'Protocol contribution adjust',
    requireAnyOf: [
      'protocol.contribution.adjust@ministry',
      'protocol.finance.manage@ministry',
    ],
  },
  {
    id: 'protocol-finance-approve',
    label: 'Protocol finance approve',
    requireAnyOf: [
      'protocol.finance.approve@ministry',
      'protocol.finance.manage@ministry',
    ],
  },
  {
    id: 'protocol-contribution-treasury-view',
    label: 'Protocol contribution treasury view',
    requireAnyOf: [
      'protocol.contribution.view.all@ministry',
      'protocol.finance.view@ministry',
      'protocol.finance.manage@ministry',
      'protocol.finance.approve@ministry',
    ],
  },
  {
    id: 'protocol-contribution-submit',
    label: 'Protocol contribution submit',
    requireAnyOf: ['protocol.contribution.submit@ministry'],
  },
  {
    id: 'protocol-finance-inbox',
    label: 'Protocol finance inbox',
    requireAnyOf: [
      'protocol.finance.approve@ministry',
      'protocol.finance.manage@ministry',
    ],
  },
  {
    id: 'protocol-team-manage',
    label: 'Protocol team manage',
    requireAnyOf: ['protocol.team.manage@ministry', 'protocol.manage@ministry'],
  },
  {
    id: 'protocol-claims-review',
    label: 'Protocol claims review',
    requireAnyOf: ['protocol.claim.review@ministry', 'protocol.manage@ministry'],
  },
  {
    id: 'protocol-admin-hub',
    label: 'Protocol admin hub',
    requireAnyOf: [
      'protocol.committee.member.manage@ministry',
      'protocol.invite@ministry',
      'protocol.claim.review@ministry',
      'protocol.manage@ministry',
    ],
  },
  {
    id: 'protocol-manage',
    label: 'Protocol manage',
    requireAnyOf: ['protocol.manage@ministry'],
  },
  {
    id: 'protocol-communications',
    label: 'Protocol communications',
    requireAnyOf: [
      'protocol.manage@ministry',
      'protocol.oversight@ministry',
      'protocol.team.manage@ministry',
    ],
  },
  {
    id: 'protocol-view',
    label: 'Protocol view',
    requireAnyOf: [
      'protocol.view@ministry',
      'protocol.manage@ministry',
      'protocol.oversight@ministry',
      'protocol.operational.monitor@ministry',
      'protocol.team.manage@ministry',
      'protocol.ranking.view@ministry',
      'protocol.report@ministry',
      'protocol.attendance.mark@ministry',
      'protocol.attendance.manage@ministry',
      'protocol.replacement.manage@ministry',
      'protocol.team.leader.execute@ministry',
      'protocol.team.head@ministry',
      'protocol.invite@ministry',
      'protocol.claim.review@ministry',
      'protocol.committee.member.manage@ministry',
    ],
  },
  {
    id: 'protocol-invite',
    label: 'Protocol invite',
    requireAnyOf: ['protocol.invite@ministry', 'protocol.manage@ministry'],
  },
  {
    id: 'protocol-team-leader-manage',
    label: 'Protocol team leader manage',
    requireAnyOf: ['protocol.team.leader.manage@ministry'],
  },
  {
    id: 'protocol-committee-member-manage',
    label: 'Protocol committee member manage',
    requireAnyOf: [
      'protocol.committee.member.manage@ministry',
      'protocol.manage@ministry',
    ],
  },
  {
    id: 'protocol-committee-role-manage',
    label: 'Protocol committee role manage',
    requireAnyOf: ['protocol.committee.role.manage@ministry'],
  },
  {
    id: 'protocol-team-approve-publish',
    label: 'Protocol team approve/publish',
    requireAnyOf: [
      'protocol.team.approve@ministry',
      'protocol.team.publish@ministry',
      'protocol.team.manage@ministry',
      'protocol.manage@ministry',
    ],
  },
  {
    id: 'protocol-team-leadership',
    label: 'Protocol team leadership',
    requireAnyOf: [
      'protocol.manage@ministry',
      'protocol.team.manage@ministry',
      'protocol.team.leader.manage@ministry',
    ],
  },
  {
    id: 'protocol-attendance-manage',
    label: 'Protocol attendance manage',
    requireAnyOf: [
      'protocol.attendance.manage@ministry',
      'protocol.team.leader.execute@ministry',
      'protocol.team.head@ministry',
      'protocol.attendance.mark@ministry',
    ],
  },
  {
    id: 'protocol-replacement-manage',
    label: 'Protocol replacement manage',
    requireAnyOf: [
      'protocol.replacement.manage@ministry',
      'protocol.team.head@ministry',
      'protocol.team.leader.execute@ministry',
    ],
  },
  {
    id: 'protocol-report',
    label: 'Protocol report',
    requireAnyOf: ['protocol.report@ministry'],
  },
  {
    id: 'protocol-report-team-ops',
    label: 'Protocol report team ops',
    requireAnyOf: [
      'protocol.report@ministry',
      'protocol.team.leader.execute@ministry',
      'protocol.team.head@ministry',
      'protocol.team.manage@ministry',
    ],
  },
  {
    id: 'protocol-rankings-oversight',
    label: 'Protocol rankings oversight',
    requireAnyOf: [
      'protocol.manage@ministry',
      'protocol.operational.monitor@ministry',
      'protocol.oversight@ministry',
      'protocol.team.manage@ministry',
    ],
  },
  {
    id: 'protocol-treasury-export',
    label: 'Protocol treasury export',
    requireAnyOf: [
      'protocol.finance.view@ministry',
      'protocol.finance.manage@ministry',
      'protocol.finance.approve@ministry',
    ],
  },
  {
    id: 'protocol-admin-settings',
    label: 'Protocol admin settings',
    requireAnyOf: [
      'protocol.manage@ministry',
      'protocol.committee.member.manage@ministry',
    ],
  },
  {
    id: 'choir-governance-manage',
    label: 'Choir governance manage',
    requireAnyOf: ['church.governance.manage@church'],
  },
  {
    id: 'choir-service-request-schedule',
    label: 'Choir service request schedule',
    requireAnyOf: [
      'church.choir.ops.schedule@church',
      'church.choir.ops.manage@church',
      'church.governance.manage@church',
    ],
  },
  {
    id: 'choir-service-request-create',
    label: 'Choir service request create',
    requireAnyOf: [
      'church.governance.manage@church',
      'church.operations.manage@church',
    ],
  },
  {
    id: 'choir-service-requests-view',
    label: 'Choir service requests view',
    requireAnyOf: [
      'church.governance.manage@church',
      'church.governance.view@church',
      'church.operations.manage@church',
      'church.choir.oversight@church',
      'church.choir.ops.schedule@church',
    ],
  },
  {
    id: 'choir-service-assignments-view',
    label: 'Choir service assignments view',
    requireAnyOf: [
      'church.choir.ops.schedule@church',
      'church.choir.ops.manage@church',
      'church.governance.manage@church',
    ],
  },
  {
    id: 'ministry-announcement-manage',
    label: 'Ministry announcement manage',
    requireAnyOf: ['church.ministry.announcement.manage@church'],
  },
  {
    id: 'ministry-announcement-view',
    label: 'Ministry announcement view',
    requireAnyOf: [
      'church.ministry.view@church',
      'church.ministry.announcement.view@church',
      'church.ministry.announcement.manage@church',
    ],
  },
  {
    id: 'ministry-settings-manage',
    label: 'Ministry settings manage',
    requireAnyOf: ['church.ministry.settings.manage@church'],
  },
  {
    id: 'ministry-platform-view',
    label: 'Ministry platform view',
    requireAnyOf: [
      'church.ministry.view@church',
      'church.ministry.manage@church',
      'church.ministry.dashboard.view@church',
      'church.ministry.activity.view@church',
      'church.ministry.report.view@church',
      'church.ministry.reports.view@church',
    ],
  },
  {
    id: 'pilot-readiness-view',
    label: 'Pilot readiness view',
    requireAnyOf: [
      'pilot.readiness.view@platform',
      'admin.settings.manage@platform',
      'admin.settings.view@platform',
      'church.intelligence.view@church',
      'admin.users.view@platform',
    ],
  },
  {
    id: 'admin-import',
    label: 'Admin import',
    requireAnyOf: ['pilot.import.manage@platform', 'admin.users.manage@platform'],
  },
  {
    id: 'admin-users-manage',
    label: 'Admin users manage',
    requireAnyOf: [
      'admin.users.manage@platform',
      'admin.users.view@platform',
    ],
  },
  {
    id: 'admin-settings-manage',
    label: 'Admin settings manage',
    requireAnyOf: [
      'admin.settings.manage@platform',
      'admin.settings.view@platform',
    ],
  },
  {
    id: 'admin-roles-manage',
    label: 'Admin roles manage',
    requireAnyOf: [
      'admin.roles.manage@platform',
      'admin.roles.view@platform',
    ],
  },
  {
    id: 'admin-audit-view',
    label: 'Admin audit view',
    requireAnyOf: ['admin.audit.view@platform'],
  },
  {
    id: 'admin-sync-manage',
    label: 'Admin sync manage',
    requireAnyOf: ['admin.sync.manage@platform'],
  },
  {
    id: 'member-manage',
    label: 'Member manage',
    requireAnyOf: ['church.member.manage@church'],
  },
  {
    id: 'report-export',
    label: 'Report export',
    requireAnyOf: ['church.report.export@church'],
  },
];

export function platformUiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const def = PLATFORM_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
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
