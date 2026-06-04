import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ContributionStatus,
  MinistryScope,
  ThankYouDeliveryStatus,
} from '@prisma/client';
import { PERMISSIONS } from '../common/constants/roles';
import { ThankYouService } from './thank-you.service';

function mockOperationalContext(overrides: Record<string, unknown> = {}) {
  return {
    actorUserId: 'treasurer-1',
    memberId: 'member-1',
    permissions: [
      PERMISSIONS.CHOIR_FINANCE_MANAGE,
      PERMISSIONS.CHOIR_FINANCE_APPROVE,
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

describe('ThankYouService', () => {
  const audit = { log: jest.fn() };
  const notifications = { sendContributionThankYou: jest.fn() };
  const operationalScope = {
    buildForUser: jest.fn().mockResolvedValue(mockOperationalContext()),
  };
  const prisma = {
    contributionRecord: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const sms = {
    isEnabled: jest.fn().mockReturnValue(false),
    sendThankYou: jest.fn().mockResolvedValue({ sent: false, skippedReason: 'sms_disabled' }),
  };

  const service = new ThankYouService(
    prisma as never,
    audit as never,
    notifications as never,
    operationalScope as never,
    sms as never,
  );

  const baseRecord = {
    id: 'contrib-1',
    memberId: 'member-1',
    status: ContributionStatus.CONFIRMED,
    contributionType: 'TITHE',
    amount: 5000,
    currency: 'RWF',
    referenceNumber: 'CNT-TEST-001',
    confirmedAt: new Date(),
    thankYouSentAt: null,
    thankYouSentById: null,
    thankYouDeliveryStatus: ThankYouDeliveryStatus.PENDING,
    confirmedAmount: 5000,
    member: {
      firstName: 'Test',
      lastName: 'Member',
      memberNumber: 'M000001',
      userId: 'user-1',
      phone: '0781234567',
      ministry: MinistryScope.CHOIR,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    operationalScope.buildForUser.mockResolvedValue(mockOperationalContext());
    notifications.sendContributionThankYou.mockResolvedValue({ id: 'notif-1' });
  });

  it('sends thank-you on first automatic send', async () => {
    prisma.contributionRecord.findUnique.mockResolvedValue(baseRecord);
    prisma.contributionRecord.updateMany.mockResolvedValue({ count: 1 });
    prisma.contributionRecord.findUniqueOrThrow.mockResolvedValue({
      ...baseRecord,
      thankYouDeliveryStatus: ThankYouDeliveryStatus.SENT,
      thankYouSentAt: new Date(),
    });

    await service.sendContributionThankYou('contrib-1', 'head-1', {
      automatic: true,
    });

    expect(notifications.sendContributionThankYou).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 5000 }),
    );
    expect(prisma.contributionRecord.updateMany).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CONTRIBUTION_THANK_YOU_SENT' }),
    );
  });

  it('prevents duplicate automatic sends', async () => {
    prisma.contributionRecord.findUnique.mockResolvedValue({
      ...baseRecord,
      thankYouDeliveryStatus: ThankYouDeliveryStatus.SENT,
      thankYouSentAt: new Date(),
    });

    await service.sendContributionThankYou('contrib-1', null, { automatic: true });

    expect(notifications.sendContributionThankYou).not.toHaveBeenCalled();
  });

  it('resend works and creates audit log', async () => {
    prisma.contributionRecord.findUnique
      .mockResolvedValueOnce({
        ...baseRecord,
        member: { ministry: MinistryScope.CHOIR },
      })
      .mockResolvedValueOnce(baseRecord);
    prisma.contributionRecord.update.mockResolvedValue({
      ...baseRecord,
      thankYouDeliveryStatus: ThankYouDeliveryStatus.SENT,
      thankYouSentAt: new Date(),
      thankYouSentById: 'treasurer-1',
    });

    await service.resendContributionThankYou('treasurer-1', 'contrib-1');

    expect(notifications.sendContributionThankYou).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CONTRIBUTION_THANK_YOU_RESEND' }),
    );
  });

  it('marks delivery failure when notification fails', async () => {
    prisma.contributionRecord.findUnique
      .mockResolvedValueOnce(baseRecord)
      .mockResolvedValueOnce({ confirmedById: 'head-1' });
    prisma.contributionRecord.updateMany.mockResolvedValue({ count: 1 });
    notifications.sendContributionThankYou.mockRejectedValue(new Error('send failed'));
    prisma.contributionRecord.update.mockResolvedValue({
      ...baseRecord,
      thankYouDeliveryStatus: ThankYouDeliveryStatus.FAILED,
    });
    prisma.contributionRecord.findUniqueOrThrow.mockResolvedValue({
      ...baseRecord,
      thankYouDeliveryStatus: ThankYouDeliveryStatus.FAILED,
    });

    await service.sendContributionThankYou('contrib-1', 'head-1', {
      automatic: true,
    });

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CONTRIBUTION_THANK_YOU_FAILED' }),
    );
  });

  it('blocks resend without finance scope', async () => {
    operationalScope.buildForUser.mockResolvedValueOnce(
      mockOperationalContext({ permissions: [] }),
    );
    prisma.contributionRecord.findUnique.mockResolvedValue({
      ...baseRecord,
      member: { ministry: MinistryScope.CHOIR },
    });

    await expect(
      service.resendContributionThankYou('user-x', 'contrib-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('hasAlreadySent returns true only for sent records with timestamp', () => {
    expect(
      service.hasAlreadySent({
        thankYouDeliveryStatus: ThankYouDeliveryStatus.SENT,
        thankYouSentAt: new Date(),
      }),
    ).toBe(true);
    expect(
      service.hasAlreadySent({
        thankYouDeliveryStatus: ThankYouDeliveryStatus.PENDING,
        thankYouSentAt: null,
      }),
    ).toBe(false);
  });

  it('rejects thank-you for unconfirmed contributions', async () => {
    prisma.contributionRecord.findUnique.mockResolvedValue({
      ...baseRecord,
      status: ContributionStatus.SUBMITTED,
    });

    await expect(
      service.sendContributionThankYou('contrib-1', null, { automatic: true }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
