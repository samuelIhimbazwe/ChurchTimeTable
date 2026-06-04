import { PERMISSIONS } from '../common/constants/roles';

export function hasGlobalMinistryFinanceView(permissions: string[]): boolean {
  return (
    permissions.includes(PERMISSIONS.MINISTRY_FINANCE_MANAGE) ||
    permissions.includes(PERMISSIONS.MINISTRY_FINANCE_REPORT) ||
    permissions.includes(PERMISSIONS.MINISTRY_FINANCE_VIEW) ||
    permissions.includes(PERMISSIONS.MINISTRY_FINANCE_OVERSIGHT) ||
    permissions.includes(PERMISSIONS.MINISTRY_MANAGE)
  );
}

export function hasGlobalMinistryFinanceManage(permissions: string[]): boolean {
  return (
    permissions.includes(PERMISSIONS.MINISTRY_FINANCE_MANAGE) ||
    permissions.includes(PERMISSIONS.MINISTRY_MANAGE)
  );
}

export function canCreateMinistryExpense(permissions: string[]): boolean {
  return (
    hasGlobalMinistryFinanceManage(permissions) ||
    permissions.includes(PERMISSIONS.MINISTRY_FINANCE_EXPENSE_CREATE)
  );
}

export function canApproveMinistryExpense(permissions: string[]): boolean {
  return (
    hasGlobalMinistryFinanceManage(permissions) ||
    permissions.includes(PERMISSIONS.MINISTRY_FINANCE_EXPENSE_APPROVE)
  );
}

export function canReportMinistryFinance(permissions: string[]): boolean {
  return (
    hasGlobalMinistryFinanceView(permissions) ||
    permissions.includes(PERMISSIONS.MINISTRY_FINANCE_REPORT)
  );
}
