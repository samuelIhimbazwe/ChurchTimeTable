import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FamilyMemberRole } from '@prisma/client';
import { MemberProfileAccessService } from './member-profile-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { ContributionScopeService } from '../finance/contribution-scope.service';
import { PERMISSIONS } from '../common/constants/roles';

describe('MemberProfileAccessService', () => {
  let service: MemberProfileAccessService;
  let prisma: {
    member: { findUnique: jest.Mock };
    familyMember: { findUnique: jest.Mock };
  };
  let permissions: { resolveForUser: jest.Mock };
  let contributionScope: {
    resolveActor: jest.Mock;
    canViewAll: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      member: { findUnique: jest.fn() },
      familyMember: { findUnique: jest.fn() },
    };
    permissions = { resolveForUser: jest.fn() };
    contributionScope = {
      resolveActor: jest.fn(),
      canViewAll: jest.fn().mockReturnValue(false),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberProfileAccessService,
        { provide: PrismaService, useValue: prisma },
        { provide: PermissionsResolver, useValue: permissions },
        { provide: ContributionScopeService, useValue: contributionScope },
      ],
    }).compile();

    service = module.get(MemberProfileAccessService);
  });

  it('allows self to view profile', async () => {
    prisma.member.findUnique.mockResolvedValue({
      id: 'm1',
      user: { id: 'u1', email: 'a@test.com' },
      familyMembership: null,
    });
    permissions.resolveForUser.mockResolvedValue({
      memberId: 'm1',
      permissions: [],
    });

    const result = await service.assertCanViewMemberProfile('u1', 'm1');
    expect(result.isSelf).toBe(true);
  });

  it('denies unrelated member with 404', async () => {
    prisma.member.findUnique.mockResolvedValue({
      id: 'm2',
      user: { id: 'u2', email: 'b@test.com' },
      familyMembership: { familyId: 'f1', family: { familyName: 'A', familyCode: 'A' } },
    });
    permissions.resolveForUser.mockResolvedValue({
      memberId: 'm1',
      permissions: [],
    });
    contributionScope.resolveActor.mockResolvedValue({
      memberId: 'm1',
      permissions: [],
      familyMemberships: [],
    });
    prisma.familyMember.findUnique.mockResolvedValue({
      familyId: 'f9',
      role: FamilyMemberRole.MEMBER,
    });

    await expect(
      service.assertCanViewMemberProfile('u1', 'm2'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows family head to view same-family member', async () => {
    prisma.member.findUnique.mockResolvedValue({
      id: 'm2',
      user: { id: 'u2', email: 'b@test.com' },
      familyMembership: { familyId: 'f1', family: { familyName: 'A', familyCode: 'A' } },
    });
    permissions.resolveForUser.mockResolvedValue({
      memberId: 'm1',
      permissions: [],
    });
    prisma.familyMember.findUnique.mockResolvedValue({
      familyId: 'f1',
      role: FamilyMemberRole.HEAD,
    });

    const result = await service.assertCanViewMemberProfile('u1', 'm2');
    expect(result.isSelf).toBe(false);
  });

  it('grants family leader contribution visibility', async () => {
    prisma.familyMember.findUnique
      .mockResolvedValueOnce({ familyId: 'f1', role: FamilyMemberRole.HEAD })
      .mockResolvedValueOnce({ familyId: 'f1', role: FamilyMemberRole.MEMBER });

    const allowed = await service.canViewMemberContributions(
      'u1',
      'm2',
      [PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_FAMILY],
      false,
      'm1',
    );
    expect(allowed).toBe(true);
  });

  it('allows self attendance detail without event:read', async () => {
    const allowed = await service.canViewAttendanceDetail(
      [],
      true,
      'm1',
      'm1',
    );
    expect(allowed).toBe(true);
  });
});
