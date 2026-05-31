/** Mirrors backend governance-permissions.util — keep in sync for UI gating */

export const PROTOCOL_OVERSIGHT = "protocol.oversight";
export const PROTOCOL_TEAM_MANAGE = "protocol.team.manage";
export const PROTOCOL_TEAM_HEAD = "protocol.team.head";
export const PROTOCOL_OPERATIONAL_MONITOR = "protocol.operational.monitor";
export const PROTOCOL_ATTENDANCE_MANAGE = "protocol.attendance.manage";
export const CHOIR_OVERSIGHT = "choir.oversight";
export const CHOIR_OPERATIONS_MANAGE = "choir.operations.manage";
export const CHOIR_ATTENDANCE_MANAGE = "choir.attendance.manage";

export function hasEffectivePermission(
  permissions: string[],
  claim: string,
): boolean {
  if (permissions.includes(claim)) return true;
  return permissions.some(
    (p) => p.startsWith("committee:") && p.endsWith(`:${claim}`),
  );
}

export function hasAnyEffectivePermission(
  permissions: string[],
  claims: string[],
): boolean {
  return claims.some((c) => hasEffectivePermission(permissions, c));
}

export function hasProtocolOversight(permissions: string[]): boolean {
  return hasEffectivePermission(permissions, PROTOCOL_OVERSIGHT);
}

export function hasProtocolCoordination(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, [
    PROTOCOL_TEAM_MANAGE,
    PROTOCOL_OPERATIONAL_MONITOR,
  ]);
}

export function hasProtocolTeamHead(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, [
    PROTOCOL_TEAM_HEAD,
    "attendance.mark",
    PROTOCOL_ATTENDANCE_MANAGE,
  ]);
}

export function hasChoirOperations(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, [
    CHOIR_OVERSIGHT,
    CHOIR_OPERATIONS_MANAGE,
    "choir.events.manage",
    CHOIR_ATTENDANCE_MANAGE,
  ]);
}

export function hasOperationalLeaderDashboard(permissions: string[]): boolean {
  return (
    hasProtocolOversight(permissions) ||
    hasProtocolCoordination(permissions) ||
    hasProtocolTeamHead(permissions) ||
    hasChoirOperations(permissions) ||
    permissions.includes("report:export")
  );
}

export function canMarkAttendance(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, [
    "attendance:write",
    PROTOCOL_ATTENDANCE_MANAGE,
    CHOIR_ATTENDANCE_MANAGE,
    "attendance.mark",
  ]);
}

/** Route/nav guard: any of these grants attendance workspace access */
export const ATTENDANCE_ACCESS_PERMISSIONS = [
  "event:read",
  "attendance:write",
  "attendance.mark",
  PROTOCOL_ATTENDANCE_MANAGE,
  PROTOCOL_TEAM_HEAD,
  PROTOCOL_TEAM_MANAGE,
  PROTOCOL_OVERSIGHT,
  PROTOCOL_OPERATIONAL_MONITOR,
  CHOIR_ATTENDANCE_MANAGE,
  CHOIR_OVERSIGHT,
  CHOIR_OPERATIONS_MANAGE,
  "report:export",
] as const;

export const COVERAGE_ACCESS_PERMISSIONS = [
  "event:read",
  "swap:manage",
  PROTOCOL_TEAM_HEAD,
  PROTOCOL_TEAM_MANAGE,
  PROTOCOL_OVERSIGHT,
  PROTOCOL_OPERATIONAL_MONITOR,
  "report:export",
] as const;

export function canAccessAttendanceWorkspace(permissions: string[]): boolean {
  return ATTENDANCE_ACCESS_PERMISSIONS.some((p) =>
    hasEffectivePermission(permissions, p),
  );
}

export const CHOIR_FINANCE_VIEW = "choir.finance.view";
export const CHOIR_FINANCE_MANAGE = "choir.finance.manage";
export const CHOIR_FINANCE_APPROVE = "choir.finance.approve";
export const PROTOCOL_FINANCE_VIEW = "protocol.finance.view";
export const PROTOCOL_FINANCE_MANAGE = "protocol.finance.manage";
export const PROTOCOL_FINANCE_APPROVE = "protocol.finance.approve";
export const MINISTRY_FINANCE_OVERSIGHT = "ministry.finance.oversight";

export function hasChoirFinanceView(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, [
    CHOIR_FINANCE_VIEW,
    CHOIR_FINANCE_MANAGE,
    CHOIR_FINANCE_APPROVE,
  ]);
}

export function hasProtocolFinanceView(permissions: string[]): boolean {
  return hasAnyEffectivePermission(permissions, [
    PROTOCOL_FINANCE_VIEW,
    PROTOCOL_FINANCE_MANAGE,
    PROTOCOL_FINANCE_APPROVE,
    PROTOCOL_OVERSIGHT,
  ]);
}

export function hasChoirFinanceApprove(permissions: string[]): boolean {
  return hasEffectivePermission(permissions, CHOIR_FINANCE_APPROVE);
}

export function hasProtocolFinanceApprove(permissions: string[]): boolean {
  return hasEffectivePermission(permissions, PROTOCOL_FINANCE_APPROVE);
}

export function canApproveFinanceForMinistry(
  permissions: string[],
  ministry: "CHOIR" | "PROTOCOL",
): boolean {
  return ministry === "CHOIR"
    ? hasChoirFinanceApprove(permissions)
    : hasProtocolFinanceApprove(permissions);
}

export function canAccessFinanceStewardship(permissions: string[]): boolean {
  return (
    hasChoirFinanceView(permissions) ||
    hasProtocolFinanceView(permissions) ||
    hasEffectivePermission(permissions, MINISTRY_FINANCE_OVERSIGHT) ||
    permissions.includes("finance:read")
  );
}

export const FINANCE_ACCESS_PERMISSIONS = [
  "finance:read",
  "finance:write",
  CHOIR_FINANCE_VIEW,
  CHOIR_FINANCE_MANAGE,
  CHOIR_FINANCE_APPROVE,
  PROTOCOL_FINANCE_VIEW,
  PROTOCOL_FINANCE_MANAGE,
  PROTOCOL_FINANCE_APPROVE,
  MINISTRY_FINANCE_OVERSIGHT,
  PROTOCOL_OVERSIGHT,
] as const;

export function canAccessCoverageWorkspace(permissions: string[]): boolean {
  return COVERAGE_ACCESS_PERMISSIONS.some((p) =>
    hasEffectivePermission(permissions, p),
  );
}

export type OperationalDashboardRole =
  | "president"
  | "coordinator"
  | "team-head"
  | "choir-leader";

/** Highest operational dashboard the actor may use (permission-first). */
export function resolveOperationalDashboardRole(
  permissions: string[],
): OperationalDashboardRole | null {
  if (hasProtocolOversight(permissions)) return "president";
  if (hasProtocolCoordination(permissions)) return "coordinator";
  if (hasProtocolTeamHead(permissions)) return "team-head";
  if (hasChoirOperations(permissions)) return "choir-leader";
  return null;
}

export function canAccessOperationalDashboard(permissions: string[]): boolean {
  return resolveOperationalDashboardRole(permissions) !== null;
}

export const MEMBER_READ = "member:read";

export const MEMBER_ROSTER_ACCESS_PERMISSIONS = [
  MEMBER_READ,
  "assignment:write",
  "event:write",
  "member:manage",
  PROTOCOL_OVERSIGHT,
  PROTOCOL_TEAM_MANAGE,
  PROTOCOL_OPERATIONAL_MONITOR,
  PROTOCOL_TEAM_HEAD,
  CHOIR_OVERSIGHT,
  CHOIR_OPERATIONS_MANAGE,
] as const;

export function canAccessMemberRoster(permissions: string[]): boolean {
  return MEMBER_ROSTER_ACCESS_PERMISSIONS.some((p) =>
    hasEffectivePermission(permissions, p),
  );
}

/** Choir operational leaders without protocol governance scope */
export function isChoirOnlyOperations(permissions: string[]): boolean {
  return (
    hasChoirOperations(permissions) &&
    !hasProtocolOversight(permissions) &&
    !hasProtocolCoordination(permissions) &&
    !hasProtocolTeamHead(permissions)
  );
}

/** Ministry-wide protocol roster visibility (not choir report:export) */
export function canViewProtocolWideRoster(permissions: string[]): boolean {
  return hasProtocolOversight(permissions) || hasProtocolCoordination(permissions);
}
