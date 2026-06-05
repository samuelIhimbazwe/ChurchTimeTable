import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import {
  ContributionAdjustmentCategory,
  ContributionCampaignStatus,
  ContributionStatus,
  ContributionType,
  FamilyMemberRole,
  MemberStatus,
  PaymentChannel,
} from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import {
  CHURCH_ADMIN_OPERATIONAL_PERMISSIONS,
  PERMISSIONS,
  ROLES,
} from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Sprint 10.2.5 — goals & lists (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let familyAId: string;
  let familyBId: string;
  let catalogId: string;
  let campaignActiveId: string;
  let campaignDraftId: string;
  let campaignCompletedId: string;
  let campaignArchivedId: string;

  let memberToken: string;
  let memberId: string;
  let headAToken: string;
  let secretaryToken: string;
  let coordinatorToken: string;
  let presidentToken: string;
  let presidentMemberId: string;
  let churchAdminToken: string;
  let memberUnionAdminToken: string;

  async function grantRole(roleName: string, permissions: string[]) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      create: { name: roleName, description: roleName },
      update: {},
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const code of [...new Set(permissions)]) {
      const p = await prisma.permission.upsert({
        where: { code },
        create: { code, description: code },
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
    return role;
  }

  async function createUser(
    label: string,
    roleName: string,
    options?: { familyId?: string; familyRole?: FamilyMemberRole },
  ) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
    const email = `s1025-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash('TestPass1', 10),
        isActive: true,
        member: {
          create: {
            firstName: label,
            lastName: 'Goals',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234567',
          },
        },
        userRoles: { create: { roleId: role.id } },
      },
      include: { member: true },
    });

    if (options?.familyId && options.familyRole) {
      await prisma.familyMember.create({
        data: {
          familyId: options.familyId,
          memberId: user.member!.id,
          role: options.familyRole,
        },
      });
      if (options.familyRole === FamilyMemberRole.HEAD) {
        await prisma.family.update({
          where: { id: options.familyId },
          data: { headMemberId: user.member!.id },
        });
      }
    }

    const token = await jwtService.signAsync({ sub: user.id, email });
    return { token, memberId: user.member!.id, userId: user.id };
  }

  async function createConfirmed(
    mid: string,
    familyId: string,
    confirmedAmount: number,
    extra?: {
      catalogId?: string;
      campaignId?: string | null;
      reference?: string;
    },
  ) {
    return prisma.contributionRecord.create({
      data: {
        memberId: mid,
        familyId,
        contributionType: ContributionType.OFFERING,
        contributionTypeCatalogId: extra?.catalogId ?? catalogId,
        contributionCampaignId: extra?.campaignId ?? null,
        amount: confirmedAmount,
        claimedAmount: confirmedAmount,
        confirmedAmount,
        status: ContributionStatus.CONFIRMED,
        referenceNumber:
          extra?.reference ??
          `CNT-1025-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        paymentAt: new Date(),
        paymentChannel: PaymentChannel.MOMO,
        confirmedAt: new Date(),
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

    await grantRole(ROLES.MEMBER, [PERMISSIONS.CHOIR_CONTRIBUTION_SUBMIT]);
    await grantRole(ROLES.CHOIR_SECRETARY, [
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_FAMILY,
    ]);
    await grantRole(ROLES.CHOIR_FAMILY_COORDINATOR, [
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
    ]);
    await grantRole(ROLES.CHOIR_PRESIDENT, [
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
      PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
    ]);
    await grantRole(ROLES.CHURCH_ADMIN, [...CHURCH_ADMIN_OPERATIONAL_PERMISSIONS]);

    const familyA = await prisma.family.create({
      data: {
        familyCode: `FAM1025A${Date.now()}`,
        familyName: 'Goals Family A',
        delegationEnabled: true,
      },
    });
    const familyB = await prisma.family.create({
      data: {
        familyCode: `FAM1025B${Date.now()}`,
        familyName: 'Goals Family B',
        delegationEnabled: true,
      },
    });
    familyAId = familyA.id;
    familyBId = familyB.id;

    const catalog = await prisma.contributionTypeCatalog.create({
      data: {
        code: `goals_cat_${Date.now()}`,
        name: 'Goals Catalog',
        active: true,
        ministryScope: 'CHOIR',
      },
    });
    catalogId = catalog.id;

    const mkCampaign = (status: ContributionCampaignStatus, name: string) =>
      prisma.contributionCampaign.create({
        data: {
          contributionTypeId: catalogId,
          name,
          goalAmount: 50000,
          status,
          ministryScope: 'CHOIR',
        },
      });

    campaignActiveId = (await mkCampaign(ContributionCampaignStatus.ACTIVE, 'Active')).id;
    campaignDraftId = (await mkCampaign(ContributionCampaignStatus.DRAFT, 'Draft')).id;
    campaignCompletedId = (
      await mkCampaign(ContributionCampaignStatus.COMPLETED, 'Completed')
    ).id;
    campaignArchivedId = (
      await mkCampaign(ContributionCampaignStatus.ARCHIVED, 'Archived')
    ).id;

    const memberUser = await createUser('member', ROLES.MEMBER, {
      familyId: familyAId,
      familyRole: FamilyMemberRole.MEMBER,
    });
    memberToken = memberUser.token;
    memberId = memberUser.memberId;

    headAToken = (
      await createUser('headA', ROLES.MEMBER, {
        familyId: familyAId,
        familyRole: FamilyMemberRole.HEAD,
      })
    ).token;

    secretaryToken = (
      await createUser('sec', ROLES.CHOIR_SECRETARY, {
        familyId: familyAId,
        familyRole: FamilyMemberRole.SECRETARY,
      })
    ).token;

    coordinatorToken = (
      await createUser('coord', ROLES.CHOIR_FAMILY_COORDINATOR)
    ).token;

    const presidentUser = await createUser('pres', ROLES.CHOIR_PRESIDENT, {
      familyId: familyAId,
      familyRole: FamilyMemberRole.MEMBER,
    });
    presidentToken = presidentUser.token;
    presidentMemberId = presidentUser.memberId;
    await createConfirmed(presidentMemberId, familyAId, 11000);

    churchAdminToken = (await createUser('cadmin', ROLES.CHURCH_ADMIN)).token;

    const union = await createUser('union', ROLES.MEMBER, {
      familyId: familyAId,
      familyRole: FamilyMemberRole.MEMBER,
    });
    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.CHURCH_ADMIN },
    });
    const memberRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.MEMBER },
    });
    await prisma.userRole.create({
      data: { userId: union.userId, roleId: adminRole.id },
    });
    memberUnionAdminToken = await jwtService.signAsync({
      sub: union.userId,
      email: `union-${Date.now()}@test.local`,
    });
    void memberRole;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Totals — status filters', () => {
    it('counts CONFIRMED effective only; excludes REJECTED and SUBMITTED from confirmed', async () => {
      await createConfirmed(memberId, familyAId, 15000);
      await prisma.contributionRecord.create({
        data: {
          memberId,
          familyId: familyAId,
          contributionType: ContributionType.OFFERING,
          contributionTypeCatalogId: catalogId,
          amount: 9000,
          claimedAmount: 9000,
          status: ContributionStatus.SUBMITTED,
          referenceNumber: `CNT-1025-SUB-${Date.now()}`,
          paymentAt: new Date(),
          paymentChannel: PaymentChannel.MOMO,
        },
      });
      await prisma.contributionRecord.create({
        data: {
          memberId,
          familyId: familyAId,
          contributionType: ContributionType.OFFERING,
          contributionTypeCatalogId: catalogId,
          amount: 4000,
          claimedAmount: 4000,
          status: ContributionStatus.REJECTED,
          referenceNumber: `CNT-1025-REJ-${Date.now()}`,
          paymentAt: new Date(),
          paymentChannel: PaymentChannel.MOMO,
          rejectionReason: 'invalid',
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/finance/contributions/totals?familyId=${familyAId}`)
        .set('Authorization', `Bearer ${headAToken}`)
        .expect(200);

      expect(res.body.data.confirmed.effectiveTotal).toBeGreaterThanOrEqual(15000);
      expect(res.body.data.pending.count).toBeGreaterThanOrEqual(1);
      expect(res.body.data.pending.claimedTotal).toBeGreaterThanOrEqual(9000);

    });
  });

  describe('Totals — adjustments vs ledger', () => {
    it('uses effectiveAmount 7000 in totals while ledger stays at confirmed 10000', async () => {
      const row = await createConfirmed(memberId, familyAId, 10000);

      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${headAToken}`)
        .send({ confirmedAmount: 10000 })
        .expect(409);

      const headMember = await prisma.family.findUniqueOrThrow({
        where: { id: familyAId },
        select: { headMemberId: true },
      });
      const headUser = await prisma.member.findUniqueOrThrow({
        where: { id: headMember.headMemberId! },
        select: { userId: true },
      });

      await prisma.contributionRecord.update({
        where: { id: row.id },
        data: {
          financeTransactionId: (
            await prisma.financeTransaction.create({
              data: {
                ministryScope: 'CHOIR',
                type: 'INCOME',
                category: 'DONATION',
                amount: 10000,
                memberId,
                recordedById: headUser.userId!,
                approvalStatus: 'APPROVED',
                transactionDate: new Date(),
              },
            })
          ).id,
        },
      });

      const treasurerRole = await grantRole(ROLES.CHOIR_TREASURER, [
        PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
        PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
      ]);
      const treasurer = await prisma.user.create({
        data: {
          email: `s1025-treas-${Date.now()}@test.local`,
          passwordHash: await bcrypt.hash('TestPass1', 10),
          isActive: true,
          member: {
            create: {
              firstName: 'Treas',
              lastName: 'Goals',
              ministry: 'CHOIR',
              status: MemberStatus.ACTIVE,
              phone: '0781234567',
            },
          },
          userRoles: { create: { roleId: treasurerRole.id } },
        },
        include: { member: true },
      });
      const treasurerToken = await jwtService.signAsync({
        sub: treasurer.id,
        email: treasurer.email,
      });

      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/adjust`)
        .set('Authorization', `Bearer ${treasurerToken}`)
        .send({
          adjustmentAmount: -3000,
          category: ContributionAdjustmentCategory.CORRECTION,
          reason: 'Partial reconciliation',
        })
        .expect(201);

      const list = await request(app.getHttpServer())
        .get(
          `/api/v1/finance/contributions/by-type/${catalogId}?familyId=${familyAId}`,
        )
        .set('Authorization', `Bearer ${headAToken}`)
        .expect(200);

      const item = list.body.data.items.find((i: { id: string }) => i.id === row.id);
      expect(item.effectiveAmount).toBe(7000);
      expect(item.confirmedAmount).toBe(10000);

      const record = await prisma.contributionRecord.findUniqueOrThrow({
        where: { id: row.id },
        include: { adjustments: true },
      });
      const tx = await prisma.financeTransaction.findUniqueOrThrow({
        where: { id: record.financeTransactionId! },
      });
      expect(Number(tx.amount)).toBe(10000);
    });
  });

  describe('Campaign progress', () => {
    it('includes ACTIVE and COMPLETED; excludes DRAFT and ARCHIVED', async () => {
      await createConfirmed(memberId, familyAId, 12000, {
        campaignId: campaignActiveId,
      });
      await createConfirmed(memberId, familyAId, 8000, {
        campaignId: campaignCompletedId,
      });
      await createConfirmed(memberId, familyAId, 6000, {
        campaignId: campaignDraftId,
      });
      await createConfirmed(memberId, familyAId, 3000, {
        campaignId: campaignArchivedId,
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/finance/contributions/totals')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .expect(200);

      const ids = res.body.data.byCampaign.map((c: { campaignId: string }) => c.campaignId);
      expect(ids).toContain(campaignActiveId);
      expect(ids).toContain(campaignCompletedId);
      expect(ids).not.toContain(campaignDraftId);
      expect(ids).not.toContain(campaignArchivedId);

      const active = res.body.data.byCampaign.find(
        (c: { campaignId: string }) => c.campaignId === campaignActiveId,
      );
      expect(active.confirmedEffective).toBeGreaterThanOrEqual(12000);
      expect(active.progressPct).toBeGreaterThan(0);
    });
  });

  describe('Rankings', () => {
    beforeAll(async () => {
      await createConfirmed(memberId, familyAId, 25000);
      const memberB = await createUser('memB', ROLES.MEMBER, {
        familyId: familyBId,
        familyRole: FamilyMemberRole.MEMBER,
      });
      await createConfirmed(memberB.memberId, familyBId, 5000);
    });

    it('orders families and contributors by effective total', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/finance/contributions/rankings?limit=5')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .expect(200);

      expect(res.body.data.scope).toBe('choir');
      expect(res.body.data.topFamilies.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.topFamilies[0].effectiveTotal).toBeGreaterThanOrEqual(
        res.body.data.topFamilies[1].effectiveTotal,
      );
      expect(res.body.data.topContributors[0].effectiveTotal).toBeGreaterThanOrEqual(
        res.body.data.topContributors[1]?.effectiveTotal ?? 0,
      );
    });

    it('head sees family-scoped rankings', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/finance/contributions/rankings')
        .set('Authorization', `Bearer ${headAToken}`)
        .expect(200);

      expect(res.body.data.scope).toBe('family');
      expect(res.body.data.familyId).toBe(familyAId);
    });
  });

  describe('Visibility', () => {
    it('denies rankings for member and secretary', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/finance/contributions/rankings')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(404);

      await request(app.getHttpServer())
        .get('/api/v1/finance/contributions/rankings')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .expect(404);
    });

    it('coordinator sees choir-wide totals with byFamily', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/finance/contributions/totals')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .expect(200);

      expect(res.body.data.scope).toBe('choir');
      expect(Array.isArray(res.body.data.byFamily)).toBe(true);
    });

    it('secretary sees family totals only', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/finance/contributions/totals?familyId=${familyAId}`)
        .set('Authorization', `Bearer ${secretaryToken}`)
        .expect(200);

      expect(res.body.data.scope).toBe('family');
      expect(res.body.data.familyId).toBe(familyAId);
    });

    it('church admin denied; union admin allowed', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/finance/contributions/totals')
        .set('Authorization', `Bearer ${churchAdminToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/v1/finance/contributions/totals')
        .set('Authorization', `Bearer ${memberUnionAdminToken}`)
        .expect(200);
    });

    it('v1.3 president retains personal visibility with choir access', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/finance/contributions/mine')
        .set('Authorization', `Bearer ${presidentToken}`)
        .expect(200);

      const ownTotals = await request(app.getHttpServer())
        .get('/api/v1/finance/contributions/totals?scope=own')
        .set('Authorization', `Bearer ${presidentToken}`)
        .expect(200);

      expect(ownTotals.body.data.scope).toBe('own');
      expect(ownTotals.body.data.confirmed.effectiveTotal).toBeGreaterThanOrEqual(
        11000,
      );

      const choirTotals = await request(app.getHttpServer())
        .get('/api/v1/finance/contributions/totals')
        .set('Authorization', `Bearer ${presidentToken}`)
        .expect(200);

      expect(choirTotals.body.data.scope).toBe('choir');
    });

    it('member sees own totals only', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/finance/contributions/totals')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(res.body.data.scope).toBe('own');

      await request(app.getHttpServer())
        .get(`/api/v1/finance/contributions/totals?familyId=${familyAId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(404);
    });
  });

  describe('By-type list', () => {
    it('returns effective amounts for leadership', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/finance/contributions/by-type/${catalogId}?familyId=${familyAId}`)
        .set('Authorization', `Bearer ${headAToken}`)
        .expect(200);

      expect(res.body.data.items.length).toBeGreaterThan(0);
      const confirmed = res.body.data.items.find(
        (i: { status: string }) => i.status === 'CONFIRMED',
      );
      expect(confirmed).toBeTruthy();
      expect(confirmed.effectiveAmount).toBeDefined();
      expect(confirmed.claimedAmount).toBeDefined();
      expect(confirmed.confirmedAmount).toBeDefined();
    });
  });
});
