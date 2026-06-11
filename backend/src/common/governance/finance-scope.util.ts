import { ForbiddenException } from '@nestjs/common';
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
  /** Church secretary/treasurer — church-wide ledger only (not choir/protocol) */
  churchWideFinanceOnly: boolean;
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

const MINISTRY_FINANCE_VIEW_CLAIMS = [
  PERMISSIONS.MINISTRY_FINANCE_VIEW,
  PERMISSIONS.MINISTRY_FINANCE_MANAGE,
  PERMISSIONS.MINISTRY_FINANCE_REPORT,
] as const;

const MINISTRY_SCOPED_FINANCE_CLAIMS = [
  ...CHOIR_FINANCE_VIEW_CLAIMS,
  ...PROTOCOL_FINANCE_VIEW_CLAIMS,
  PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
  PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
  PERMISSIONS.PROTOCOL_CONTRIBUTION_VIEW_ALL,
  PERMISSIONS.PROTOCOL_CONTRIBUTION_ADJUST,
] as const;

export function buildFinanceScopeContext(
  operational: OperationalScopeContext,
): FinanceScopeContext {
  const { permissions } = operational;
  const ministryScopes: MinistryScope[] = [];

  const hasOversight =
    hasEffectivePermission(permissions, PERMISSIONS.MINISTRY_FINANCE_OVERSIGHT) ||
    hasProtocolOversight(permissions);

  const hasMinistryFinance = hasAnyEffectivePermission(
    permissions,
    MINISTRY_FINANCE_VIEW_CLAIMS,
  );
  const hasUnitFinance = hasAnyEffectivePermission(
    permissions,
    MINISTRY_SCOPED_FINANCE_CLAIMS,
  );
  const churchWideFinanceOnly = hasMinistryFinance && !hasOversight && !hasUnitFinance;

  if (hasOversight) {
    ministryScopes.push(MinistryScope.CHOIR, MinistryScope.PROTOCOL);
  } else if (churchWideFinanceOnly) {
    ministryScopes.push(MinistryScope.BOTH);
  } else {
    if (
      hasAnyEffectivePermission(permissions, CHOIR_FINANCE_VIEW_CLAIMS) ||
      hasEffectivePermission(permissions, PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST) ||
      hasEffectivePermission(permissions, PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL)
    ) {
      ministryScopes.push(MinistryScope.CHOIR);
    }
    if (hasAnyEffectivePermission(permissions, PROTOCOL_FINANCE_VIEW_CLAIMS)) {
      ministryScopes.push(MinistryScope.PROTOCOL);
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
    churchWideFinanceOnly,
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

/** Sprint 10 choir treasurer / coordinator contribution record stewardship */
export function assertContributionStewardScope(
  ctx: FinanceScopeContext,
  ministry: MinistryScope,
): void {
  if (!canAccessMinistryFinance(ctx, ministry)) {
    throw new ForbiddenException('Finance access denied for this ministry');
  }

  if (
    (ministry === MinistryScope.CHOIR || ministry === MinistryScope.BOTH) &&
    hasEffectivePermission(ctx.permissions, PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST)
  ) {
    return;
  }

  if (
    ministry === MinistryScope.PROTOCOL &&
    (hasEffectivePermission(ctx.permissions, PERMISSIONS.PROTOCOL_CONTRIBUTION_ADJUST) ||
      hasEffectivePermission(ctx.permissions, PERMISSIONS.PROTOCOL_FINANCE_MANAGE))
  ) {
    return;
  }

  const canManage =
    (ministry === MinistryScope.CHOIR && ctx.canManageChoir) ||
    (ministry === MinistryScope.PROTOCOL && ctx.canManageProtocol) ||
    (ministry === MinistryScope.BOTH &&
      (ctx.canManageChoir || ctx.canManageProtocol));
  if (!canManage && !ctx.canApproveChoir && !ctx.canApproveProtocol) {
    throw new ForbiddenException('Cannot manage contributions for this ministry');
  }
}
