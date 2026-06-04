import {
  OPERATIONAL_UNIT_GLOBAL_MANAGE_PERMISSIONS,
  OPERATIONAL_UNIT_GLOBAL_VIEW_PERMISSIONS,
  PERMISSIONS,
} from '../common/constants/roles';

export function hasGlobalOperationalUnitManage(permissions: string[]): boolean {
  return OPERATIONAL_UNIT_GLOBAL_MANAGE_PERMISSIONS.some((p) =>
    permissions.includes(p),
  );
}

export function hasGlobalOperationalUnitView(permissions: string[]): boolean {
  return (
    hasGlobalOperationalUnitManage(permissions) ||
    OPERATIONAL_UNIT_GLOBAL_VIEW_PERMISSIONS.some((p) => permissions.includes(p))
  );
}

export function hasUnitPermission(
  permissions: string[],
  unitScoped: Map<string, Set<string>>,
  unitId: string,
  required: string | string[],
): boolean {
  if (hasGlobalOperationalUnitManage(permissions)) return true;
  const codes = Array.isArray(required) ? required : [required];
  if (codes.some((c) => permissions.includes(c))) return true;
  const scoped = unitScoped.get(unitId);
  if (!scoped) return false;
  return codes.some((c) => scoped.has(c));
}

export function canViewUnitMembers(
  permissions: string[],
  unitScoped: Map<string, Set<string>>,
  unitId: string,
  ministryLeaderMinistryIds: Set<string>,
  unitMinistryId: string,
  isUnitLeader: boolean,
): boolean {
  if (isMinistryLeaderFor(ministryLeaderMinistryIds, unitMinistryId)) return true;
  if (isUnitLeader) return true;
  return hasUnitPermission(permissions, unitScoped, unitId, [
    PERMISSIONS.OPERATIONAL_UNIT_MEMBER_VIEW,
    PERMISSIONS.OPERATIONAL_UNIT_MEMBER_MANAGE,
    'operational_unit.member.view',
    'operational_unit.member.manage',
  ]);
}

export function canManageUnitMembers(
  permissions: string[],
  unitScoped: Map<string, Set<string>>,
  unitId: string,
  ministryLeaderMinistryIds: Set<string>,
  unitMinistryId: string,
  isUnitLeader: boolean,
): boolean {
  if (isMinistryLeaderFor(ministryLeaderMinistryIds, unitMinistryId)) return true;
  if (isUnitLeader) return true;
  return hasUnitPermission(permissions, unitScoped, unitId, [
    PERMISSIONS.OPERATIONAL_UNIT_MEMBER_MANAGE,
    'operational_unit.member.manage',
  ]);
}

export function canViewUnitLeadership(
  permissions: string[],
  unitScoped: Map<string, Set<string>>,
  unitId: string,
  ministryLeaderMinistryIds: Set<string>,
  unitMinistryId: string,
  isUnitLeader: boolean,
): boolean {
  if (isMinistryLeaderFor(ministryLeaderMinistryIds, unitMinistryId)) return true;
  if (isUnitLeader) return true;
  return hasUnitPermission(permissions, unitScoped, unitId, [
    PERMISSIONS.OPERATIONAL_UNIT_LEADERSHIP_VIEW,
    PERMISSIONS.OPERATIONAL_UNIT_LEADERSHIP_MANAGE,
    'operational_unit.leadership.manage',
  ]);
}

export function canManageUnitLeadership(
  permissions: string[],
  unitScoped: Map<string, Set<string>>,
  unitId: string,
  ministryLeaderMinistryIds: Set<string>,
  unitMinistryId: string,
  isUnitLeader: boolean,
): boolean {
  if (isMinistryLeaderFor(ministryLeaderMinistryIds, unitMinistryId)) return true;
  if (isUnitLeader) return true;
  return hasUnitPermission(permissions, unitScoped, unitId, [
    PERMISSIONS.OPERATIONAL_UNIT_LEADERSHIP_MANAGE,
    'operational_unit.leadership.manage',
  ]);
}

export function canManageUnitSettings(
  permissions: string[],
  unitScoped: Map<string, Set<string>>,
  unitId: string,
  ministryLeaderMinistryIds: Set<string>,
  unitMinistryId: string,
  isUnitLeader: boolean,
): boolean {
  if (isMinistryLeaderFor(ministryLeaderMinistryIds, unitMinistryId)) return true;
  if (isUnitLeader) return true;
  return hasUnitPermission(permissions, unitScoped, unitId, [
    PERMISSIONS.OPERATIONAL_UNIT_SETTINGS_MANAGE,
    'operational_unit.settings.manage',
  ]);
}

export function canManageUnitPermissions(
  permissions: string[],
  unitScoped: Map<string, Set<string>>,
  unitId: string,
  ministryLeaderMinistryIds: Set<string>,
  unitMinistryId: string,
): boolean {
  if (hasGlobalOperationalUnitManage(permissions)) return true;
  if (isMinistryLeaderFor(ministryLeaderMinistryIds, unitMinistryId)) return true;
  return hasUnitPermission(permissions, unitScoped, unitId, [
    PERMISSIONS.OPERATIONAL_UNIT_MANAGE,
  ]);
}

function isMinistryLeaderFor(
  ministryLeaderMinistryIds: Set<string>,
  ministryId: string,
): boolean {
  return ministryLeaderMinistryIds.has(ministryId);
}
