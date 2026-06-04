import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';

export function hasChoirOpsView(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.CHOIR_OPS_VIEW) ||
    hasEffectivePermission(permissions, PERMISSIONS.CHOIR_OPS_MANAGE) ||
    hasEffectivePermission(permissions, PERMISSIONS.CHOIR_REHEARSAL_VIEW) ||
    hasEffectivePermission(permissions, PERMISSIONS.CHOIR_OVERSIGHT)
  );
}

export function hasChoirOpsManage(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.CHOIR_OPS_MANAGE) ||
    hasEffectivePermission(permissions, PERMISSIONS.CHOIR_OPERATIONS_MANAGE)
  );
}

export function hasChoirOpsSchedule(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.CHOIR_OPS_SCHEDULE) ||
    hasChoirOpsManage(permissions)
  );
}

export function hasChoirOpsAttendance(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.CHOIR_OPS_ATTENDANCE) ||
    hasEffectivePermission(permissions, PERMISSIONS.CHOIR_ATTENDANCE_MANAGE) ||
    hasChoirOpsManage(permissions)
  );
}

export function hasChoirOpsRankingView(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.CHOIR_OPS_RANKING_VIEW) ||
    hasChoirOpsManage(permissions) ||
    hasEffectivePermission(permissions, PERMISSIONS.CHOIR_OVERSIGHT)
  );
}

export function hasChoirOpsReport(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.CHOIR_OPS_REPORT) ||
    hasEffectivePermission(permissions, PERMISSIONS.CHOIR_REPORTS_VIEW) ||
    hasChoirOpsView(permissions)
  );
}
