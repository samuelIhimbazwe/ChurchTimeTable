import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import {
  ContributionStatus,
  ContributionType,
  FamilyMemberRole,
  MemberStatus,
  PaymentChannel,
} from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { PERMISSIONS, ROLES } from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Sprint 10.2.4 — ledger posting (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let familyAId: string;
  let catalogId: string;

  let headAToken: string;
  let assistantOnToken: string;
  let memberAId: string;

  async function grantMemberRole() {
    const role = await prisma.role.upsert({
      where: { name: ROLES.MEMBER },
      create: { name: ROLES.MEMBER, description: ROLES.MEMBER },
      update: {},
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    const p = await prisma.permission.upsert({
      where: { code: PERMISSIONS.CHOIR_CONTRIBUTION_SUBMIT },
      create: { code: PERMISSIONS.CHOIR_CONTRIBUTION_SUBMIT, description: 'submit' },
      update: {},
    });
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: p.id,
        },
      },
      create: { roleId: role.id, permissionId: p.id },
      update: {},
    });
  }

  async function createUser(
    label: string,
    familyId: string,
    role: FamilyMemberRole,
  ) {
    const memberRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.MEMBER },
    });
    const email = `s1024-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash('TestPass1', 10),
        isActive: true,
        member: {
          create: {
            firstName: label,
            lastName: 'Ledger',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234567',
          },
        },
        userRoles: { create: { roleId: memberRole.id } },
      },
      include: { member: true },
    });

    await prisma.familyMember.create({
      data: { familyId, memberId: user.member!.id, role },
    });
    if (role === FamilyMemberRole.HEAD) {
      await prisma.family.update({
        where: { id: familyId },
        data: { headMemberId: user.member!.id },
      });
    }

    const token = await jwtService.signAsync({ sub: user.id, email });
    return { token, memberId: user.member!.id };
  }

  async function createSubmitted(memberId: string, familyId: string, amount: number) {
    return prisma.contributionRecord.create({
      data: {
        memberId,
        familyId,
        contributionType: ContributionType.OFFERING,
        contributionTypeCatalogId: catalogId,
        amount,
        claimedAmount: amount,
        status: ContributionStatus.SUBMITTED,
        referenceNumber: `CNT-1024-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        paymentAt: new Date(),
        paymentChannel: PaymentChannel.MOMO,
      },
    });
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    await grantMemberRole();

    const familyA = await prisma.family.create({
      data: {
        familyCode: `FAM1024A${Date.now()}`,
        familyName: 'Ledger A',
        delegationEnabled: true,
      },
    });
    familyAId = familyA.id;

    const catalog = await prisma.contributionTypeCatalog.create({
      data: {
        code: `ledger_cat_${Date.now()}`,
        name: 'Ledger Catalog',
        active: true,
        ministryScope: 'CHOIR',
      },
    });
    catalogId = catalog.id;

    headAToken = (await createUser('headA', familyAId, FamilyMemberRole.HEAD)).token;
    assistantOnToken = (
      await createUser('asst', familyAId, FamilyMemberRole.ASSISTANT_HEAD)
    ).token;
    memberAId = (await createUser('memA', familyAId, FamilyMemberRole.MEMBER)).memberId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Suite 4 — ledger posting', () => {
    it('head approve creates finance transaction at confirmedAmount', async () => {
      const row = await createSubmitted(memberAId, familyAId, 12000);
      const res = await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${headAToken}`)
        .send({ confirmedAmount: 12000 })
        .expect(201);

      expect(res.body.data.financeTransactionId).toBeTruthy();

      const tx = await prisma.financeTransaction.findUniqueOrThrow({
        where: { id: res.body.data.financeTransactionId },
      });
      expect(Number(tx.amount)).toBe(12000);
      expect(tx.memberId).toBe(memberAId);
      expect(tx.approvalStatus).toBe('APPROVED');

      const record = await prisma.contributionRecord.findUniqueOrThrow({
        where: { id: row.id },
      });
      expect(record.financeTransactionId).toBe(tx.id);
      expect(Number(record.claimedAmount)).toBe(12000);
    });

    it('assistant approve creates ledger entry', async () => {
      const row = await createSubmitted(memberAId, familyAId, 5500);
      const res = await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${assistantOnToken}`)
        .send({ confirmedAmount: 5500 })
        .expect(201);

      expect(res.body.data.financeTransactionId).toBeTruthy();
      const tx = await prisma.financeTransaction.findUniqueOrThrow({
        where: { id: res.body.data.financeTransactionId },
      });
      expect(Number(tx.amount)).toBe(5500);
    });

    it('discrepancy posts ledger at confirmed amount only', async () => {
      const row = await createSubmitted(memberAId, familyAId, 10000);
      const res = await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${headAToken}`)
        .send({
          confirmedAmount: 7000,
          discrepancyReason: 'Partial MoMo received',
        })
        .expect(201);

      const tx = await prisma.financeTransaction.findUniqueOrThrow({
        where: { id: res.body.data.financeTransactionId },
      });
      expect(Number(tx.amount)).toBe(7000);
      expect(Number(tx.amount)).not.toBe(10000);
    });

    it('reject does not create finance transaction', async () => {
      const row = await createSubmitted(memberAId, familyAId, 5000);
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/reject`)
        .set('Authorization', `Bearer ${headAToken}`)
        .send({ rejectionReason: 'Not accepted' })
        .expect(201);

      const record = await prisma.contributionRecord.findUniqueOrThrow({
        where: { id: row.id },
      });
      expect(record.financeTransactionId).toBeNull();
      expect(record.status).toBe('REJECTED');
    });

    it('double approve returns 409 and no second transaction', async () => {
      const row = await createSubmitted(memberAId, familyAId, 6000);
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${headAToken}`)
        .send({ confirmedAmount: 6000 })
        .expect(201);

      const txBefore = await prisma.financeTransaction.count();
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${headAToken}`)
        .send({ confirmedAmount: 6000 })
        .expect(409);
      const txAfter = await prisma.financeTransaction.count();
      expect(txAfter).toBe(txBefore);
    });

    it('writes CONTRIBUTION_CONFIRMED and FINANCE_TRANSACTION_CREATE audits', async () => {
      const row = await createSubmitted(memberAId, familyAId, 9000);
      const res = await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${headAToken}`)
        .send({ confirmedAmount: 9000 })
        .expect(201);

      const confirmed = await prisma.auditLog.findFirst({
        where: { action: 'CONTRIBUTION_CONFIRMED', entityId: row.id },
      });
      expect(confirmed).toBeTruthy();
      expect((confirmed!.newValue as Record<string, unknown>).financeTransactionId).toBe(
        res.body.data.financeTransactionId,
      );

      const ledger = await prisma.auditLog.findFirst({
        where: {
          action: 'FINANCE_TRANSACTION_CREATE',
          entityId: res.body.data.financeTransactionId,
        },
      });
      expect(ledger).toBeTruthy();
      expect((ledger!.newValue as Record<string, unknown>).contributionRecordId).toBe(
        row.id,
      );
    });
  });
});
