import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FinanceExportService } from './finance-export.service';
import { FinanceGovernanceService } from './finance-governance.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('FinanceExportService', () => {
  let service: FinanceExportService;
  const financeGovernance = {
    scopeForUser: jest.fn(),
    memberContributions: jest.fn(),
  };
  const prisma = {
    financeTransaction: { findMany: jest.fn().mockResolvedValue([]) },
    memberDues: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FinanceExportService,
        { provide: FinanceGovernanceService, useValue: financeGovernance },
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    service = module.get(FinanceExportService);
    jest.clearAllMocks();
  });

  it('denies ministry export when actor has no scope', async () => {
    financeGovernance.scopeForUser.mockResolvedValue({
      ministryScopes: [],
      canManageChoir: false,
      canManageProtocol: false,
      canApproveChoir: false,
      canApproveProtocol: false,
    });
    await expect(
      service.exportMinistryCsv('user-1', { ministryScope: 'CHOIR' as any }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
