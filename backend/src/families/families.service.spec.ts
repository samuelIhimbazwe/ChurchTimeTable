import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { FamilyMemberRole, MinistryScope } from '@prisma/client';
import { PERMISSIONS } from '../common/constants/roles';
import { FamiliesService } from './families.service';

function mockOperationalContext(overrides: Record<string, unknown> = {}) {
  return {
    actorUserId: 'leader-1',
    memberId: 'leader-member',
    permissions: [PERMISSIONS.FAMILY_VIEW, PERMISSIONS.FAMILY_MANAGE],
    ministryIds: ['CHOIR'],
    protocolMinistryIds: [],
    choirScopeIds: [],
    teamIds: [],
    scopedMemberIds: [],
    canProtocolOversight: false,
    canProtocolCoordinate: false,
    canProtocolTeamHead: false,
    canChoirOperations: true,
    ...overrides,
  };
}

describe('FamiliesService', () => {
  const audit = { log: jest.fn() };
  const operationalScope = {
    buildForUser: jest.fn().mockResolvedValue(mockOperationalContext()),
  };
  const prisma = {
    family: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    familyMember: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    familyCodeSequence: {
      upsert: jest.fn(),
      update: jest.fn(),
    },
    member: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const service = new FamiliesService(
    prisma as never,
    audit as never,
    operationalScope as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    operationalScope.buildForUser.mockResolvedValue(mockOperationalContext());
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => unknown) =>
      fn(prisma),
    );
    prisma.familyCodeSequence.upsert.mockResolvedValue({});
    prisma.familyCodeSequence.update.mockResolvedValue({ nextValue: 2 });
  });

  it('generates sequential family codes', async () => {
    const code = await service.generateFamilyCode(prisma as never);
    expect(code).toBe('FAM000001');
  });

  it('prevents duplicate family membership on add', async () => {
    prisma.family.findFirst.mockResolvedValue({ id: 'family-1' });
    prisma.member.findUnique.mockResolvedValue({
      id: 'member-2',
      ministry: MinistryScope.CHOIR,
    });
    prisma.familyMember.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      service.addMember('leader-1', 'family-1', {
        memberId: 'member-2',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('enforces unique HEAD role per family', async () => {
    prisma.family.findFirst.mockResolvedValue({ id: 'family-1' });
    prisma.familyMember.findUnique.mockResolvedValue(null);
    prisma.familyMember.findFirst.mockResolvedValue({ id: 'head-row' });
    prisma.member.findUnique.mockResolvedValue({
      id: 'member-2',
      ministry: MinistryScope.CHOIR,
    });

    await expect(
      service.addMember('leader-1', 'family-1', {
        memberId: 'member-2',
        role: FamilyMemberRole.HEAD,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires headMemberId to belong to the same family on update', async () => {
    prisma.family.findFirst.mockResolvedValue({ id: 'family-1' });
    prisma.familyMember.findFirst.mockResolvedValue(null);

    await expect(
      service.update('leader-1', 'family-1', { headMemberId: 'member-x' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('denies list access without family permissions', async () => {
    operationalScope.buildForUser.mockResolvedValueOnce(
      mockOperationalContext({ permissions: [PERMISSIONS.EVENT_READ] }),
    );

    await expect(service.list('user-x')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
