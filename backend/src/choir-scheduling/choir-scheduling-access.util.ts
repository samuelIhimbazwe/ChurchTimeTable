import { PERMISSIONS } from '../common/constants/roles';
import { can } from '../common/choir/capability-can.util';
import type { ResolvedAuth } from '../common/choir/capability.types';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';

const OPS_VIEW = 'choir.ops.view@choir';
const OPS_MANAGE = 'choir.ops.manage@choir';
const OPS_SCHEDULE = 'choir.ops.schedule@choir';
const OPS_ATTENDANCE = 'choir.ops.attendance@choir';

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

export function hasChoirOpsViewFromAuth(auth: ResolvedAuth | undefined): boolean {
  if (!auth) return false;
  return (
    can(auth, OPS_VIEW)
    || can(auth, OPS_MANAGE)
    || can(auth, OPS_SCHEDULE)
  );
}

export function hasChoirOpsManageFromAuth(auth: ResolvedAuth | undefined): boolean {
  if (!auth) return false;
  return can(auth, OPS_MANAGE);
}

export function hasChoirOpsScheduleFromAuth(auth: ResolvedAuth | undefined): boolean {
  if (!auth) return false;
  return can(auth, OPS_SCHEDULE) || hasChoirOpsManageFromAuth(auth);
}

export function hasChoirOpsAttendanceFromAuth(auth: ResolvedAuth | undefined): boolean {
  if (!auth) return false;
  return can(auth, OPS_ATTENDANCE) || hasChoirOpsManageFromAuth(auth);
}

export function hasChoirOpsRankingViewFromAuth(auth: ResolvedAuth | undefined): boolean {
  if (!auth) return false;
  return (
    can(auth, OPS_VIEW)
    || hasChoirOpsManageFromAuth(auth)
  );
}

export function hasChoirOpsReportFromAuth(auth: ResolvedAuth | undefined): boolean {
  if (!auth) return false;
  return hasChoirOpsViewFromAuth(auth) || hasChoirOpsManageFromAuth(auth);
}
