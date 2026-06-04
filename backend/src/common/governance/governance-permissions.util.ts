import { PERMISSIONS } from '../constants/roles';

/** Claims that grant protocol ministry-wide executive oversight */
export const PROTOCOL_OVERSIGHT_CLAIMS = [
  PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,
] as const;

/** Claims that grant protocol coordination across teams */
export const PROTOCOL_COORDINATOR_CLAIMS = [
  PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,
  PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,
] as const;

/** Claims that grant team-head scoped protocol operations */
export const PROTOCOL_TEAM_HEAD_CLAIMS = [
  PERMISSIONS.PROTOCOL_TEAM_HEAD,
  PERMISSIONS.ATTENDANCE_MARK_SCOPE,
  PERMISSIONS.PROTOCOL_ATTENDANCE_MANAGE,
] as const;

/** Claims that grant choir operational leadership */
export const CHOIR_OPERATIONS_CLAIMS = [
  PERMISSIONS.CHOIR_OVERSIGHT,
  PERMISSIONS.CHOIR_OPERATIONS_MANAGE,
  PERMISSIONS.CHOIR_EVENTS_MANAGE_SCOPE,
  PERMISSIONS.CHOIR_ATTENDANCE_MANAGE,
] as const;

export function hasEffectivePermission(
  permissions: string[],
  claim: string,
): boolean {
  if (permissions.includes(claim)) return true;
  const prefix = `committee:`;
  return permissions.some(
    (p) => p.startsWith(prefix) && p.endsWith(`:${claim}`),
  );
}

export function hasAnyEffectivePermission(
  permissions: string[],
  claims: readonly string[],
): boolean {
  return claims.some((claim) => hasEffectivePermission(permissions, claim));
}

export function hasProtocolOversight(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, PROTOCOL_OVERSIGHT_CLAIMS);
}

export function hasProtocolCoordination(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, PROTOCOL_COORDINATOR_CLAIMS);
}

export function hasProtocolTeamHeadAuthority(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, PROTOCOL_TEAM_HEAD_CLAIMS);
}

export function hasChoirOperations(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, CHOIR_OPERATIONS_CLAIMS);
}

export function hasOperationalLeaderDashboard(permissions: string[]): boolean {
  return (
    hasProtocolOversight(permissions) ||
    hasProtocolCoordination(permissions) ||
    hasProtocolTeamHeadAuthority(permissions) ||
    hasChoirOperations(permissions)
  );
}

/** Church / ministry leadership dashboard access — excludes report:export (reports only) */
export const LEADER_DASHBOARD_ACCESS_CLAIMS = [
  ...PROTOCOL_OVERSIGHT_CLAIMS,
  ...PROTOCOL_COORDINATOR_CLAIMS,
  ...PROTOCOL_TEAM_HEAD_CLAIMS,
  ...CHOIR_OPERATIONS_CLAIMS,
  PERMISSIONS.MEMBER_MANAGE,
  PERMISSIONS.EVENT_WRITE,
  PERMISSIONS.ASSIGNMENT_WRITE,
  PERMISSIONS.ATTENDANCE_WRITE,
  PERMISSIONS.SWAP_MANAGE,
  PERMISSIONS.DISCIPLINE_MANAGE,
  PERMISSIONS.FAMILY_MANAGE,
] as const;

export function canAccessLeaderDashboard(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, LEADER_DASHBOARD_ACCESS_CLAIMS);
}

export const ATTENDANCE_NAV_CLAIMS = [
  PERMISSIONS.EVENT_READ,
  PERMISSIONS.ATTENDANCE_WRITE,
  PERMISSIONS.ATTENDANCE_MARK_SCOPE,
  PERMISSIONS.PROTOCOL_ATTENDANCE_MANAGE,
  PERMISSIONS.PROTOCOL_TEAM_HEAD,
  PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,
  PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,
  PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,
  PERMISSIONS.CHOIR_ATTENDANCE_MANAGE,
  PERMISSIONS.CHOIR_OVERSIGHT,
  PERMISSIONS.CHOIR_OPERATIONS_MANAGE,
] as const;

export const COVERAGE_NAV_CLAIMS = [
  PERMISSIONS.EVENT_READ,
  PERMISSIONS.SWAP_MANAGE,
  PERMISSIONS.PROTOCOL_TEAM_HEAD,
  PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,
  PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,
  PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,
] as const;

export const FINANCE_NAV_CLAIMS = [
  PERMISSIONS.CHOIR_FINANCE_VIEW,
  PERMISSIONS.CHOIR_FINANCE_MANAGE,
  PERMISSIONS.CHOIR_FINANCE_APPROVE,
  PERMISSIONS.PROTOCOL_FINANCE_VIEW,
  PERMISSIONS.PROTOCOL_FINANCE_MANAGE,
  PERMISSIONS.PROTOCOL_FINANCE_APPROVE,
  PERMISSIONS.MINISTRY_FINANCE_OVERSIGHT,
  PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,
  PERMISSIONS.FINANCE_VIEW_SCOPE,
] as const;

export function canAccessAttendanceNav(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, ATTENDANCE_NAV_CLAIMS);
}

export function canAccessCoverageNav(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, COVERAGE_NAV_CLAIMS);
}

export function canAccessFinanceNav(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, FINANCE_NAV_CLAIMS);
}

/** Safe assignment / picker roster — no email or phone */
export const MEMBER_ROSTER_ACCESS_CLAIMS = [
  PERMISSIONS.MEMBER_READ,
  PERMISSIONS.ASSIGNMENT_WRITE,
  PERMISSIONS.EVENT_WRITE,
  PERMISSIONS.MEMBER_MANAGE,
  PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,
  PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,
  PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,
  PERMISSIONS.PROTOCOL_TEAM_HEAD,
  PERMISSIONS.CHOIR_OVERSIGHT,
  PERMISSIONS.CHOIR_OPERATIONS_MANAGE,
] as const;

export function canAccessMemberRoster(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, MEMBER_ROSTER_ACCESS_CLAIMS);
}

export function canManageMemberDirectory(permissions: string[]): boolean {
  return hasEffectivePermission(permissions, PERMISSIONS.MEMBER_MANAGE);
}

export function canViewFamilies(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, [
    PERMISSIONS.FAMILY_VIEW,
    PERMISSIONS.FAMILY_MANAGE,
  ]);
}

export function canManageFamilies(permissions: string[]): boolean {
  return hasEffectivePermission(permissions, PERMISSIONS.FAMILY_MANAGE);
}

const FINANCE_INTELLIGENCE_CLAIMS = [
  PERMISSIONS.CHOIR_FINANCE_VIEW,
  PERMISSIONS.CHOIR_FINANCE_MANAGE,
  PERMISSIONS.CHOIR_FINANCE_APPROVE,
  PERMISSIONS.PROTOCOL_FINANCE_VIEW,
  PERMISSIONS.PROTOCOL_FINANCE_MANAGE,
  PERMISSIONS.PROTOCOL_FINANCE_APPROVE,
  PERMISSIONS.MINISTRY_FINANCE_OVERSIGHT,
  PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,
  PERMISSIONS.FINANCE_VIEW_SCOPE,
] as const;

export function canViewFinanceIntelligence(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, FINANCE_INTELLIGENCE_CLAIMS);
}

const DISCIPLINE_INTELLIGENCE_CLAIMS = [
  PERMISSIONS.DISCIPLINE_READ_ALL,
  PERMISSIONS.DISCIPLINE_MANAGE,
  PERMISSIONS.DISCIPLINE_REVIEW_SCOPE,
] as const;

export function canViewDisciplineIntelligence(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, DISCIPLINE_INTELLIGENCE_CLAIMS);
}

const ADMIN_AUDIT_CLAIMS = [PERMISSIONS.ADMIN_AUDIT_VIEW] as const;

const ADMIN_SYNC_CLAIMS = [PERMISSIONS.ADMIN_SYNC_MANAGE] as const;

const ADMIN_SETTINGS_VIEW_CLAIMS = [
  PERMISSIONS.ADMIN_SETTINGS_VIEW,
  PERMISSIONS.ADMIN_SETTINGS_MANAGE,
] as const;

const ADMIN_SETTINGS_MANAGE_CLAIMS = [
  PERMISSIONS.ADMIN_SETTINGS_MANAGE,
] as const;

const ADMIN_USERS_VIEW_CLAIMS = [
  PERMISSIONS.ADMIN_USERS_VIEW,
  PERMISSIONS.ADMIN_USERS_MANAGE,
] as const;

const ADMIN_ROLES_VIEW_CLAIMS = [
  PERMISSIONS.ADMIN_ROLES_VIEW,
  PERMISSIONS.ADMIN_ROLES_MANAGE,
] as const;

export const PLATFORM_ADMIN_VIEW_CLAIMS = [
  PERMISSIONS.ADMIN_AUDIT_VIEW,
  PERMISSIONS.ADMIN_SETTINGS_VIEW,
  PERMISSIONS.ADMIN_USERS_VIEW,
  PERMISSIONS.ADMIN_ROLES_VIEW,
  PERMISSIONS.ADMIN_SYNC_MANAGE,
] as const;

export function canViewAdminAudit(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, ADMIN_AUDIT_CLAIMS);
}

export function canManageAdminSync(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, ADMIN_SYNC_CLAIMS);
}

export function canViewAdminSettings(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, ADMIN_SETTINGS_VIEW_CLAIMS);
}

export function canManageAdminSettings(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, ADMIN_SETTINGS_MANAGE_CLAIMS);
}

export function canViewAdminUsers(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, ADMIN_USERS_VIEW_CLAIMS);
}

export function canViewAdminRoles(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, ADMIN_ROLES_VIEW_CLAIMS);
}

export function hasPlatformAdminAccess(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, PLATFORM_ADMIN_VIEW_CLAIMS);
}

export function isChurchOperationalAdmin(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.MEMBER_MANAGE) &&
    !hasPlatformAdminAccess(permissions)
  );
}
