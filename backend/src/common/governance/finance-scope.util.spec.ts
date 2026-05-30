import { MinistryScope } from '@prisma/client';
import { PERMISSIONS } from '../constants/roles';
import {
  buildFinanceScopeContext,
  canAccessMinistryFinance,
} from './finance-scope.util';
import type { OperationalScopeContext } from '../../governance/operational-scope.types';

const baseOperational = (
  overrides: Partial<OperationalScopeContext> = {},
): OperationalScopeContext => ({
  actorUserId: 'user-1',
  memberId: 'member-1',
  permissions: [],
  ministryIds: ['CHOIR'],
  protocolMinistryIds: ['protocol-ministry'],
  choirScopeIds: ['default-choir'],
  teamIds: [],
  scopedMemberIds: [],
  canProtocolOversight: false,
  canProtocolCoordinate: false,
  canProtocolTeamHead: false,
  canChoirOperations: false,
  ...overrides,
});

describe('finance-scope.util', () => {
  it('grants choir scope for choir treasurer permissions', () => {
    const ctx = buildFinanceScopeContext(
      baseOperational({
        permissions: [PERMISSIONS.CHOIR_FINANCE_MANAGE],
      }),
    );
    expect(ctx.ministryScopes).toContain(MinistryScope.CHOIR);
    expect(canAccessMinistryFinance(ctx, MinistryScope.CHOIR)).toBe(true);
    expect(canAccessMinistryFinance(ctx, MinistryScope.PROTOCOL)).toBe(false);
  });

  it('grants protocol scope for protocol finance view', () => {
    const ctx = buildFinanceScopeContext(
      baseOperational({
        permissions: [PERMISSIONS.PROTOCOL_FINANCE_VIEW],
      }),
    );
    expect(ctx.ministryScopes).toContain(MinistryScope.PROTOCOL);
  });

  it('president oversight uses executive summary mode', () => {
    const ctx = buildFinanceScopeContext(
      baseOperational({
        permissions: [PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE],
        canProtocolOversight: true,
      }),
    );
    expect(ctx.executiveSummaryOnly).toBe(true);
    expect(ctx.ministryScopes).toEqual(
      expect.arrayContaining([MinistryScope.CHOIR, MinistryScope.PROTOCOL]),
    );
  });
});
