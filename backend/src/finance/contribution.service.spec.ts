import { ForbiddenException } from '@nestjs/common';
import {
  ContributionStatus,
  ContributionType,
  MinistryScope,
} from '@prisma/client';
import { PERMISSIONS } from '../common/constants/roles';
import { ContributionService } from './contribution.service';

function mockOperationalContext(
  overrides: Record<string, unknown> = {},
) {
  return {
    actorUserId: 'user-1',
    memberId: 'member-1',
    permissions: [
      PERMISSIONS.CHOIR_FINANCE_MANAGE,
      PERMISSIONS.CHOIR_FINANCE_APPROVE,
      PERMISSIONS.FINANCE_WRITE,
    ],
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

describe('ContributionService', () => {
  const audit = { log: jest.fn() };
  const notifications = { onContributionConfirmed: jest.fn() };
  const operationalScope = {
    buildForUser: jest.fn().mockResolvedValue(mockOperationalContext()),
  };
  const prisma = {
    contributionRecord: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
    },
    member: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    memberDues: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    financeTransaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const service = new ContributionService(
    prisma as never,
    audit as never,
    operationalScope as never,
    notifications as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    operationalScope.buildForUser.mockResolvedValue(mockOperationalContext());
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => unknown) =>
      fn(prisma),
    );
  });

  it('creates a pending contribution with reference number', async () => {
    prisma.member.findUnique.mockResolvedValue({
      id: 'member-1',
      ministry: MinistryScope.CHOIR,
      userId: 'user-1',
    });
    prisma.contributionRecord.findUnique.mockResolvedValue(null);
    prisma.contributionRecord.create.mockResolvedValue({
      id: 'contrib-1',
      memberId: 'member-1',
      familyId: null,
      financeTransactionId: null,
      memberDueId: null,
      contributionType: ContributionType.TITHE,
      amount: 5000,
      currency: 'RWF',
      status: ContributionStatus.PENDING,
      referenceNumber: 'CNT-20260530-ABC123',
      notes: null,
      receiptUrl: null,
      confirmedAt: null,
      confirmedById: null,
      thankYouSentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      member: {
        memberNumber: 'M000001',
        firstName: 'Test',
        lastName: 'Member',
        ministry: MinistryScope.CHOIR,
      },
    });

    const result = await service.createContribution('user-1', {
      memberId: 'member-1',
      contributionType: ContributionType.TITHE,
      amount: 5000,
    });

    expect(result.referenceNumber).toMatch(/^CNT-/);
    expect(result.status).toBe('PENDING');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CONTRIBUTION_CREATE' }),
    );
  });

  it('confirms a submitted contribution and creates finance transaction', async () => {
    prisma.contributionRecord.findUnique.mockResolvedValue({
      id: 'contrib-1',
      memberId: 'member-1',
      memberDueId: null,
      contributionType: ContributionType.OFFERING,
      amount: 3000,
      currency: 'RWF',
      status: ContributionStatus.SUBMITTED,
      referenceNumber: 'CNT-TEST-001',
      receiptUrl: null,
      notes: null,
      member: { ministry: MinistryScope.CHOIR, userId: 'user-1' },
    });
    prisma.member.findUniqueOrThrow.mockResolvedValue({
      ministry: MinistryScope.CHOIR,
      userId: 'user-1',
    });
    prisma.financeTransaction.create.mockResolvedValue({ id: 'tx-1' });
    prisma.contributionRecord.update.mockResolvedValue({
      id: 'contrib-1',
      memberId: 'member-1',
      familyId: null,
      financeTransactionId: 'tx-1',
      memberDueId: null,
      contributionType: ContributionType.OFFERING,
      amount: 3000,
      currency: 'RWF',
      status: ContributionStatus.CONFIRMED,
      referenceNumber: 'CNT-TEST-001',
      notes: null,
      receiptUrl: null,
      confirmedAt: new Date(),
      confirmedById: 'user-1',
      thankYouSentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      member: {
        memberNumber: 'M000001',
        firstName: 'Test',
        lastName: 'Member',
        ministry: MinistryScope.CHOIR,
      },
    });

    const result = await service.confirmContribution('user-1', 'contrib-1');

    expect(result.status).toBe('CONFIRMED');
    expect(result.financeTransactionId).toBe('tx-1');
    expect(notifications.onContributionConfirmed).toHaveBeenCalled();
  });

  it('rejects a submitted contribution', async () => {
    prisma.contributionRecord.findUnique.mockResolvedValue({
      id: 'contrib-1',
      memberId: 'member-1',
      status: ContributionStatus.SUBMITTED,
      notes: null,
      member: { ministry: MinistryScope.CHOIR, userId: 'user-2' },
    });
    prisma.contributionRecord.update.mockResolvedValue({
      id: 'contrib-1',
      memberId: 'member-1',
      familyId: null,
      financeTransactionId: null,
      memberDueId: null,
      contributionType: ContributionType.OTHER,
      amount: 1000,
      currency: 'RWF',
      status: ContributionStatus.REJECTED,
      referenceNumber: 'CNT-TEST-002',
      notes: 'Invalid receipt',
      receiptUrl: null,
      confirmedAt: null,
      confirmedById: null,
      thankYouSentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      member: {
        memberNumber: 'M000001',
        firstName: 'Test',
        lastName: 'Member',
        ministry: MinistryScope.CHOIR,
      },
    });

    const result = await service.rejectContribution(
      'user-1',
      'contrib-1',
      'Invalid receipt',
    );

    expect(result.status).toBe('REJECTED');
  });

  it('returns contribution statistics for scoped ministries', async () => {
    prisma.contributionRecord.aggregate.mockResolvedValue({
      _sum: { amount: 10000 },
      _count: 2,
    });
    prisma.contributionRecord.count.mockResolvedValue(1);
    prisma.contributionRecord.findMany.mockResolvedValue([
      {
        amount: 5000,
        contributionType: ContributionType.TITHE,
        confirmedAt: new Date(),
      },
    ]);

    const stats = await service.getContributionStats([MinistryScope.CHOIR]);

    expect(stats.contributionTotals).toBe(10000);
    expect(stats.pendingConfirmationCount).toBe(1);
    expect(stats.contributionTypeDistribution.length).toBeGreaterThan(0);
  });

  it('denies member contributions without profile', async () => {
    operationalScope.buildForUser.mockResolvedValueOnce(
      mockOperationalContext({ memberId: undefined, permissions: [] }),
    );

    await expect(service.getMemberContributions('user-x')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
