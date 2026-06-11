import { ROLES } from '../common/constants/roles';

export const DEFAULT_PROTOCOL_MINISTRY_ID = 'protocol-ministry';

/** Maps account roles to protocol committee role keys. */
/** System ministry leader accounts map to president (leader ≡ president). */
export const SYSTEM_PROTOCOL_ROLE_TO_COMMITTEE: Record<string, string> = {
  [ROLES.PROTOCOL_LEADER]: 'protocol_president',
  [ROLES.PROTOCOL_ADMIN]: 'protocol_president',
};

export const COMMITTEE_ROLE_HUB_SEGMENT: Record<string, string> = {
  protocol_admin: 'admin',
  protocol_president: 'president',
  protocol_vice_president: 'vice-president',
  protocol_coordinator: 'coordinator',
  protocol_treasurer: 'treasury',
  protocol_secretary: 'secretary',
  protocol_team_head: 'team-leader',
};

export const PROTOCOL_LANDING_ROLE_PRIORITY = [
  'protocol_president',
  'protocol_admin',
  'protocol_vice_president',
  'protocol_coordinator',
  'protocol_treasurer',
  'protocol_secretary',
  'protocol_team_head',
] as const;

export function resolveProtocolLandingPath(
  positions: Array<{ roleKey: string }>,
): string {
  for (const key of PROTOCOL_LANDING_ROLE_PRIORITY) {
    if (positions.some((p) => p.roleKey === key)) {
      const segment = COMMITTEE_ROLE_HUB_SEGMENT[key];
      if (segment) return `/protocol/${segment}`;
    }
  }
  return '/protocol/member';
}

export function inferProtocolCommitteeRoleKeys(systemRoles: string[]): string[] {
  const keys = new Set<string>();
  for (const role of systemRoles) {
    const key = SYSTEM_PROTOCOL_ROLE_TO_COMMITTEE[role];
    if (key) keys.add(key);
  }
  return [...keys];
}

export function isProtocolScopedDashboardPermission(perm: string): boolean {
  return (
    perm.startsWith('protocol.') ||
    perm.startsWith('member') ||
    perm.startsWith('event:') ||
    perm.startsWith('attendance') ||
    perm.startsWith('assignment:') ||
    perm.startsWith('report') ||
    perm.startsWith('committee.')
  );
}

export function formatProtocolCommitteeRoleName(key: string): string {
  return key
    .replace(/^protocol_/, '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
