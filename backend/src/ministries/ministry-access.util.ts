import {
  MINISTRY_GLOBAL_MANAGE_PERMISSIONS,
  MINISTRY_GLOBAL_VIEW_PERMISSIONS,
  PERMISSIONS,
} from '../common/constants/roles';

export function hasGlobalMinistryManage(permissions: string[]): boolean {
  return MINISTRY_GLOBAL_MANAGE_PERMISSIONS.some((p) => permissions.includes(p));
}

export function hasGlobalMinistryView(permissions: string[]): boolean {
  return (
    hasGlobalMinistryManage(permissions) ||
    MINISTRY_GLOBAL_VIEW_PERMISSIONS.some((p) => permissions.includes(p))
  );
}

export function hasMinistryPermission(
  permissions: string[],
  ministryScoped: Map<string, Set<string>>,
  ministryId: string,
  required: string | string[],
): boolean {
  if (hasGlobalMinistryManage(permissions)) return true;
  const codes = Array.isArray(required) ? required : [required];
  if (codes.some((c) => permissions.includes(c))) return true;
  const scoped = ministryScoped.get(ministryId);
  if (!scoped) return false;
  return codes.some((c) => scoped.has(c));
}

export function canViewMinistryMembers(
  permissions: string[],
  ministryScoped: Map<string, Set<string>>,
  ministryId: string,
): boolean {
  return hasMinistryPermission(
    permissions,
    ministryScoped,
    ministryId,
    [
      PERMISSIONS.MINISTRY_MEMBER_VIEW,
      PERMISSIONS.MINISTRY_MEMBER_MANAGE,
      'ministry.member.view',
      'ministry.member.manage',
    ],
  );
}

export function canManageMinistryMembers(
  permissions: string[],
  ministryScoped: Map<string, Set<string>>,
  ministryId: string,
): boolean {
  return hasMinistryPermission(
    permissions,
    ministryScoped,
    ministryId,
    [PERMISSIONS.MINISTRY_MEMBER_MANAGE, 'ministry.member.manage'],
  );
}

export function canViewMinistryLeadership(
  permissions: string[],
  ministryScoped: Map<string, Set<string>>,
  ministryId: string,
): boolean {
  return hasMinistryPermission(
    permissions,
    ministryScoped,
    ministryId,
    [
      PERMISSIONS.MINISTRY_LEADERSHIP_VIEW,
      PERMISSIONS.MINISTRY_LEADERSHIP_MANAGE,
      'ministry.leadership.manage',
    ],
  );
}

export function canManageMinistryLeadership(
  permissions: string[],
  ministryScoped: Map<string, Set<string>>,
  ministryId: string,
): boolean {
  return hasMinistryPermission(
    permissions,
    ministryScoped,
    ministryId,
    [PERMISSIONS.MINISTRY_LEADERSHIP_MANAGE, 'ministry.leadership.manage'],
  );
}

export function canViewMinistrySettings(
  permissions: string[],
  ministryScoped: Map<string, Set<string>>,
  ministryId: string,
): boolean {
  return hasMinistryPermission(
    permissions,
    ministryScoped,
    ministryId,
    [
      PERMISSIONS.MINISTRY_SETTINGS_VIEW,
      PERMISSIONS.MINISTRY_SETTINGS_MANAGE,
      'ministry.settings.manage',
    ],
  );
}

export function canManageMinistrySettings(
  permissions: string[],
  ministryScoped: Map<string, Set<string>>,
  ministryId: string,
): boolean {
  return hasMinistryPermission(
    permissions,
    ministryScoped,
    ministryId,
    [PERMISSIONS.MINISTRY_SETTINGS_MANAGE, 'ministry.settings.manage'],
  );
}

export function canManageMinistryPermissions(
  permissions: string[],
  ministryScoped: Map<string, Set<string>>,
  ministryId: string,
): boolean {
  return hasGlobalMinistryManage(permissions);
}
