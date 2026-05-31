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
    hasChoirOperations(permissions) ||
    hasEffectivePermission(permissions, PERMISSIONS.REPORT_EXPORT)
  );
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

const FINANCE_INTELLIGENCE_CLAIMS = [
  PERMISSIONS.FINANCE_READ,
  PERMISSIONS.FINANCE_WRITE,
  PERMISSIONS.CHOIR_FINANCE_VIEW,
  PERMISSIONS.CHOIR_FINANCE_MANAGE,
  PERMISSIONS.CHOIR_FINANCE_APPROVE,
  PERMISSIONS.PROTOCOL_FINANCE_VIEW,
  PERMISSIONS.PROTOCOL_FINANCE_MANAGE,
  PERMISSIONS.PROTOCOL_FINANCE_APPROVE,
  PERMISSIONS.MINISTRY_FINANCE_OVERSIGHT,
  PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,
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
