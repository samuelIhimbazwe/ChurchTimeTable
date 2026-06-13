import { ROLES } from '../common/constants/roles';

/** Maps system / membership role names to choir committee role keys. */
export const SYSTEM_CHOIR_ROLE_TO_COMMITTEE: Record<string, string> = {
  [ROLES.CHOIR_PRESIDENT]: 'president',
  [ROLES.CHOIR_LEADER]: 'president',
  [ROLES.CHOIR_VICE_PRESIDENT]: 'vice_president',
  [ROLES.CHOIR_SECRETARY]: 'secretary',
  [ROLES.CHOIR_TREASURER]: 'treasurer',
  [ROLES.CHOIR_REHEARSAL_DIRECTOR]: 'music_director',
  [ROLES.CHOIR_FAMILY_COORDINATOR]: 'family_coordinator',
  [ROLES.CHOIR_LOGISTICS]: 'secretary',
  [ROLES.CHOIR_COMMITTEE]: 'advisor',
};

export const COMMITTEE_ROLE_HUB_SEGMENT: Record<string, string> = {
  president: 'president',
  vice_president: 'vice-president',
  music_director: 'music-direction',
  family_coordinator: 'family-coordinator',
  family_head: 'family-leadership',
  advisor: 'advisor',
  secretary: 'records',
  treasurer: 'budget',
  discipline_social_welfare: 'care',
  spiritual_leader: 'spiritual',
};

export const CHOIR_LANDING_ROLE_PRIORITY = [
  'president',
  'vice_president',
  'music_director',
  'family_coordinator',
  'treasurer',
  'secretary',
  'discipline_social_welfare',
  'spiritual_leader',
  'family_head',
  'advisor',
] as const;

export function resolveChoirLandingPath(
  choirId: string,
  positions: Array<{ roleKey: string }>,
): string {
  for (const key of CHOIR_LANDING_ROLE_PRIORITY) {
    if (positions.some((p) => p.roleKey === key)) {
      const segment = COMMITTEE_ROLE_HUB_SEGMENT[key];
      if (segment) return `/choir/${choirId}/${segment}`;
    }
  }
  return `/choir/${choirId}/membership`;
}

export function inferCommitteeRoleKeys(
  systemRoles: string[],
  membershipRole?: string | null,
): string[] {
  const keys = new Set<string>();
  for (const role of [...systemRoles, membershipRole].filter(Boolean) as string[]) {
    const key = SYSTEM_CHOIR_ROLE_TO_COMMITTEE[role];
    if (key) keys.add(key);
  }
  return [...keys];
}

export function isChoirScopedDashboardPermission(perm: string): boolean {
  return (
    perm.startsWith('choir.') ||
    perm.startsWith('member') ||
    perm.startsWith('event:') ||
    perm.startsWith('discipline:') ||
    perm.startsWith('family:') ||
    perm.startsWith('audit:') ||
    perm.startsWith('report') ||
    perm.startsWith('assignment:') ||
    perm.startsWith('attendance') ||
    perm.startsWith('swap:') ||
    perm.startsWith('asset.')
  );
}
