import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';

export function hasChurchIntelligenceView(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.CHURCH_INTELLIGENCE_VIEW) ||
    hasEffectivePermission(permissions, PERMISSIONS.CHURCH_GOVERNANCE_VIEW) ||
    hasEffectivePermission(permissions, PERMISSIONS.MINISTRY_MANAGE)
  );
}

export function hasChurchIntelligenceManage(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.CHURCH_INTELLIGENCE_MANAGE) ||
    hasEffectivePermission(permissions, PERMISSIONS.CHURCH_GOVERNANCE_MANAGE)
  );
}

export function hasChurchReportsView(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.CHURCH_REPORTS_VIEW) ||
    hasChurchIntelligenceView(permissions)
  );
}

export function hasChurchReportsExport(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.CHURCH_REPORTS_EXPORT) ||
    hasChurchIntelligenceManage(permissions)
  );
}

export function hasChurchGovernanceView(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.CHURCH_GOVERNANCE_VIEW) ||
    hasChurchIntelligenceView(permissions)
  );
}
