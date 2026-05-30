import { MinistryScope } from '@prisma/client';
import { PERMISSIONS } from '../constants/roles';
import type { OperationalScopeContext } from '../../governance/operational-scope.types';
import {
  hasAnyEffectivePermission,
  hasEffectivePermission,
  hasProtocolOversight,
} from './governance-permissions.util';

export interface FinanceScopeContext {
  actorUserId: string;
  memberId?: string;
  permissions: string[];
  ministryScopes: MinistryScope[];
  /** President / executive: summarized KPIs only */
  executiveSummaryOnly: boolean;
  canManageChoir: boolean;
  canManageProtocol: boolean;
  canApproveChoir: boolean;
  canApproveProtocol: boolean;
  canViewOwnContributions: boolean;
}

const CHOIR_FINANCE_VIEW_CLAIMS = [
  PERMISSIONS.CHOIR_FINANCE_VIEW,
  PERMISSIONS.CHOIR_FINANCE_MANAGE,
  PERMISSIONS.CHOIR_FINANCE_APPROVE,
] as const;

const CHOIR_FINANCE_MANAGE_CLAIMS = [
  PERMISSIONS.CHOIR_FINANCE_MANAGE,
  PERMISSIONS.CHOIR_FINANCE_APPROVE,
] as const;

const PROTOCOL_FINANCE_VIEW_CLAIMS = [
  PERMISSIONS.PROTOCOL_FINANCE_VIEW,
  PERMISSIONS.PROTOCOL_FINANCE_MANAGE,
  PERMISSIONS.PROTOCOL_FINANCE_APPROVE,
] as const;

const PROTOCOL_FINANCE_MANAGE_CLAIMS = [
  PERMISSIONS.PROTOCOL_FINANCE_MANAGE,
  PERMISSIONS.PROTOCOL_FINANCE_APPROVE,
] as const;

export function buildFinanceScopeContext(
  operational: OperationalScopeContext,
): FinanceScopeContext {
  const { permissions } = operational;
  const ministryScopes: MinistryScope[] = [];

  const hasOversight =
    hasEffectivePermission(permissions, PERMISSIONS.MINISTRY_FINANCE_OVERSIGHT) ||
    hasProtocolOversight(permissions);

  if (hasOversight) {
    ministryScopes.push(MinistryScope.CHOIR, MinistryScope.PROTOCOL);
  } else {
    if (hasAnyEffectivePermission(permissions, CHOIR_FINANCE_VIEW_CLAIMS)) {
      ministryScopes.push(MinistryScope.CHOIR);
    }
    if (hasAnyEffectivePermission(permissions, PROTOCOL_FINANCE_VIEW_CLAIMS)) {
      ministryScopes.push(MinistryScope.PROTOCOL);
    }
    // Legacy choir finance bundle
    if (
      ministryScopes.length === 0 &&
      (hasEffectivePermission(permissions, PERMISSIONS.FINANCE_READ) ||
        hasEffectivePermission(permissions, PERMISSIONS.FINANCE_WRITE))
    ) {
      if (
        operational.memberId &&
        (operational.canChoirOperations ||
          operational.ministryIds.includes('CHOIR'))
      ) {
        ministryScopes.push(MinistryScope.CHOIR);
      }
    }
  }

  const executiveSummaryOnly =
    hasProtocolOversight(permissions) &&
    !hasAnyEffectivePermission(permissions, PROTOCOL_FINANCE_MANAGE_CLAIMS) &&
    !hasAnyEffectivePermission(permissions, CHOIR_FINANCE_MANAGE_CLAIMS);

  return {
    actorUserId: operational.actorUserId,
    memberId: operational.memberId,
    permissions,
    ministryScopes: [...new Set(ministryScopes)],
    executiveSummaryOnly,
    canManageChoir: hasAnyEffectivePermission(permissions, CHOIR_FINANCE_MANAGE_CLAIMS),
    canManageProtocol: hasAnyEffectivePermission(
      permissions,
      PROTOCOL_FINANCE_MANAGE_CLAIMS,
    ),
    canApproveChoir: hasAnyEffectivePermission(permissions, [
      PERMISSIONS.CHOIR_FINANCE_APPROVE,
    ]),
    canApproveProtocol: hasAnyEffectivePermission(permissions, [
      PERMISSIONS.PROTOCOL_FINANCE_APPROVE,
    ]),
    canViewOwnContributions: Boolean(operational.memberId),
  };
}

export function ministryScopeFilter(
  scopes: MinistryScope[],
): { ministryScope: { in: MinistryScope[] } } {
  return { ministryScope: { in: scopes.length ? scopes : ([] as MinistryScope[]) } };
}

export function canAccessMinistryFinance(
  ctx: FinanceScopeContext,
  scope: MinistryScope,
): boolean {
  return ctx.ministryScopes.includes(scope);
}
