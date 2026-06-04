import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';

export function hasOperationsView(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.OPERATIONS_VIEW) ||
    hasEffectivePermission(permissions, PERMISSIONS.OPERATIONS_MANAGE)
  );
}

export function hasOperationsManage(permissions: string[]): boolean {
  return hasEffectivePermission(permissions, PERMISSIONS.OPERATIONS_MANAGE);
}

export function hasOperationsScheduleApprove(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.OPERATIONS_SCHEDULE_APPROVE) ||
    hasOperationsManage(permissions)
  );
}

export function hasOperationsSchedulePublish(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.OPERATIONS_SCHEDULE_PUBLISH) ||
    hasOperationsManage(permissions)
  );
}

export function hasOperationsAssignmentManage(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.OPERATIONS_ASSIGNMENT_MANAGE) ||
    hasOperationsManage(permissions)
  );
}

export function hasOperationsAssignmentConfirm(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.OPERATIONS_ASSIGNMENT_CONFIRM) ||
    hasOperationsAssignmentManage(permissions)
  );
}

export function hasOperationsOverride(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.OPERATIONS_OVERRIDE) ||
    hasOperationsManage(permissions)
  );
}

export function hasOperationsReport(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.OPERATIONS_REPORT) ||
    hasOperationsView(permissions)
  );
}
