import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ContributionCampaignStatus,
  ContributionStatus,
  MemberStatus,
  MinistryScope,
  PaymentChannel,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { ContributionScopeService } from './contribution-scope.service';
import { ContributionSubmissionService } from './contribution-submission.service';

describe('ContributionSubmissionService', () => {
  let service: ContributionSubmissionService;

  const prisma = {
    member: { findUnique: jest.fn() },
    familyMember: { findUnique: jest.fn() },
    contributionTypeCatalog: { findUnique: jest.fn() },
    contributionCampaign: { findUnique: jest.fn() },
    contributionRecord: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    family: { findUnique: jest.fn() },
  };

  const scope = {
    resolveActor: jest.fn(),
    assertCanSubmit: jest.fn(),
  };

  const audit = { log: jest.fn() };
  const notifications = { create: jest.fn() };
  const i18n = {
    resolveLocale: jest.fn().mockReturnValue('en'),
    translate: jest.fn((_, key) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContributionSubmissionService,
        { provide: PrismaService, useValue: prisma },
        { provide: ContributionScopeService, useValue: scope },
        { provide: AuditService, useValue: audit },
        { provide: NotificationsService, useValue: notifications },
        { provide: I18nService, useValue: i18n },
      ],
    }).compile();

    service = module.get(ContributionSubmissionService);
    jest.clearAllMocks();
    scope.resolveActor.mockResolvedValue({
      userId: 'user-1',
      memberId: 'member-1',
      roles: ['MEMBER'],
      permissions: ['choir.contribution.submit'],
      familyMemberships: [],
    });
    prisma.member.findUnique.mockResolvedValue({
      id: 'member-1',
      status: MemberStatus.ACTIVE,
      phone: '0781234567',
      ministry: MinistryScope.CHOIR,
      firstName: 'Jean',
    });
    prisma.familyMember.findUnique.mockResolvedValue({ familyId: 'fam-1' });
    prisma.contributionTypeCatalog.findUnique.mockResolvedValue({
      id: 'cat-1',
      code: 'umusanzu',
      active: true,
      ministryScope: MinistryScope.CHOIR,
    });
    prisma.contributionRecord.findUnique.mockResolvedValue(null);
    prisma.contributionRecord.create.mockResolvedValue({
      id: 'rec-1',
      referenceNumber: 'CNT-TEST',
      status: ContributionStatus.SUBMITTED,
      memberId: 'member-1',
      familyId: 'fam-1',
      contributionTypeCatalogId: 'cat-1',
      contributionCampaignId: null,
      claimedAmount: 5000,
      confirmedAmount: null,
      currency: 'RWF',
      paymentAt: new Date(),
      paymentChannel: PaymentChannel.MOMO,
      receiptUrl: null,
      createdAt: new Date(),
      member: { memberNumber: 'M000001', firstName: 'Jean', lastName: 'Test' },
      contributionTypeCatalog: { code: 'umusanzu', name: 'Umusanzu' },
      contributionCampaign: null,
    });
    prisma.family.findUnique.mockResolvedValue({
      delegationEnabled: true,
      members: [],
    });
  });

  it('rejects inactive catalog type', async () => {
    prisma.contributionTypeCatalog.findUnique.mockResolvedValue({
      id: 'cat-1',
      code: 'old',
      active: false,
      ministryScope: MinistryScope.CHOIR,
    });

    await expect(
      service.submit('user-1', {
        contributionTypeCatalogId: 'cat-1',
        claimedAmount: 1000,
        paymentAt: new Date().toISOString(),
        paymentChannel: PaymentChannel.MOMO,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects non-active campaign', async () => {
    prisma.contributionCampaign.findUnique.mockResolvedValue({
      id: 'camp-1',
      contributionTypeId: 'cat-1',
      status: ContributionCampaignStatus.DRAFT,
    });

    await expect(
      service.submit('user-1', {
        contributionTypeCatalogId: 'cat-1',
        contributionCampaignId: 'camp-1',
        claimedAmount: 1000,
        paymentAt: new Date().toISOString(),
        paymentChannel: PaymentChannel.MOMO,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects member without family', async () => {
    prisma.familyMember.findUnique.mockResolvedValue(null);

    await expect(
      service.submit('user-1', {
        contributionTypeCatalogId: 'cat-1',
        claimedAmount: 1000,
        paymentAt: new Date().toISOString(),
        paymentChannel: PaymentChannel.MOMO,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
