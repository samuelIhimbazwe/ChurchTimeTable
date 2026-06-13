import { Test, TestingModule } from '@nestjs/testing';
import { FamilyMemberRole } from '@prisma/client';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS, ROLES } from '../common/constants/roles';
import { PrismaService } from '../prisma/prisma.service';
import { ContributionScopeService } from './contribution-scope.service';
import type { ContributionActorContext } from './contribution-scope.types';

describe('ContributionScopeService', () => {
  let service: ContributionScopeService;

  const prisma = {
    familyMember: { findMany: jest.fn(), findFirst: jest.fn() },
  };

  const permissionsResolver = {
    resolveForUser: jest.fn(),
  };

  const baseCtx = (
    overrides: Partial<ContributionActorContext> = {},
  ): ContributionActorContext => ({
    userId: 'user-1',
    memberId: 'member-1',
    roles: [ROLES.MEMBER],
    permissions: [PERMISSIONS.CHOIR_CONTRIBUTION_SUBMIT],
    familyMemberships: [],
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContributionScopeService,
        { provide: PrismaService, useValue: prisma },
        { provide: PermissionsResolver, useValue: permissionsResolver },
      ],
    }).compile();

    service = module.get(ContributionScopeService);
    jest.clearAllMocks();
  });

  it('denies church admin account without ministry access', () => {
    const ctx = baseCtx({
      roles: [ROLES.CHURCH_ADMIN],
      permissions: [],
      memberId: 'm-admin',
    });
    expect(service.isChurchAdminAccountOnly(ctx)).toBe(true);
    expect(() => service.assertNotChurchAdminAccountOnly(ctx)).toThrow();
  });

  it('allows head to approve when delegation is off for assistant', () => {
    const familyId = 'fam-1';
    const headCtx = baseCtx({
      familyMemberships: [
        {
          familyId,
          role: FamilyMemberRole.HEAD,
          delegationEnabled: false,
        },
      ],
    });
    const assistantCtx = baseCtx({
      memberId: 'member-2',
      familyMemberships: [
        {
          familyId,
          role: FamilyMemberRole.ASSISTANT_HEAD,
          delegationEnabled: false,
        },
      ],
    });

    expect(service.canApproveFamily(headCtx, familyId)).toBe(true);
    expect(service.canApproveFamily(assistantCtx, familyId)).toBe(false);
  });

  it('allows assistant to approve when delegation enabled', () => {
    const familyId = 'fam-1';
    const assistantCtx = baseCtx({
      familyMemberships: [
        {
          familyId,
          role: FamilyMemberRole.ASSISTANT_HEAD,
          delegationEnabled: true,
        },
      ],
    });
    expect(service.canApproveFamily(assistantCtx, familyId)).toBe(true);
  });

  it('allows treasurer to adjust but not approve', () => {
    const familyId = 'fam-1';
    const treasurerCtx = baseCtx({
      roles: [ROLES.CHOIR_TREASURER],
      permissions: [PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST],
      familyMemberships: [],
    });
    const record = { familyId, status: 'CONFIRMED' };

    expect(service.canAdjustRecord(treasurerCtx, record)).toBe(true);
    expect(service.canApproveFamily(treasurerCtx, familyId)).toBe(false);
  });

  it('allows head to adjust only within own family', () => {
    const headCtx = baseCtx({
      familyMemberships: [
        {
          familyId: 'fam-a',
          role: FamilyMemberRole.HEAD,
          delegationEnabled: false,
        },
      ],
    });

    expect(() =>
      service.assertCanAdjust(headCtx, {
        familyId: 'fam-a',
        status: 'CONFIRMED',
      }),
    ).not.toThrow();

    expect(() =>
      service.assertCanAdjust(headCtx, {
        familyId: 'fam-b',
        status: 'CONFIRMED',
      }),
    ).toThrow();
  });

  it('allows family leadership to view records in own family only', () => {
    const headCtx = baseCtx({
      familyMemberships: [
        {
          familyId: 'fam-a',
          role: FamilyMemberRole.HEAD,
          delegationEnabled: false,
        },
      ],
    });

    expect(() =>
      service.assertCanViewFamilyRecord(headCtx, { familyId: 'fam-a' }),
    ).not.toThrow();

    expect(() =>
      service.assertCanViewFamilyRecord(headCtx, { familyId: 'fam-b' }),
    ).toThrow('Not found');
  });

  it('allows secretary to view family records but not approve', () => {
    const familyId = 'fam-1';
    const secretaryCtx = baseCtx({
      memberId: 'member-sec',
      familyMemberships: [
        {
          familyId,
          role: FamilyMemberRole.SECRETARY,
          delegationEnabled: false,
        },
      ],
    });

    expect(service.canViewFamily(secretaryCtx, familyId)).toBe(true);
    expect(() =>
      service.assertCanViewFamilyRecord(secretaryCtx, { familyId }),
    ).not.toThrow();
    expect(service.canApproveFamily(secretaryCtx, familyId)).toBe(false);
  });

  it('assertMemberInFamily rejects members outside the family', async () => {
    prisma.familyMember.findFirst.mockResolvedValue(null);

    await expect(
      service.assertMemberInFamily('fam-1', 'member-x'),
    ).rejects.toThrow('Member not found in this family');
  });
});
