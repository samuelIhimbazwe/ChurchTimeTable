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
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { PERMISSIONS, ROLES } from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Sprint 10.2.2 — validates existing family inbox implementation.
 * No new backend features; documents pass/fail against requirements.
 */
describe('Sprint 10.2.2 — family inbox verification (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let familyAId: string;
  let familyBId: string;
  let catalogId: string;

  let headAToken: string;
  let headBToken: string;
  let assistantOffToken: string;
  let assistantOnToken: string;
  let secretaryToken: string;
  let presidentToken: string;
  let memberId: string;
  let memberToken: string;
  let memberBId: string;
  let memberBToken: string;

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
  }

  async function createUser(
    label: string,
    roleName: string,
    familyId: string,
    familyRole: FamilyMemberRole,
    familyOpts?: { delegationEnabled?: boolean },
  ) {
    if (familyOpts?.delegationEnabled !== undefined) {
      await prisma.family.update({
        where: { id: familyId },
        data: { delegationEnabled: familyOpts.delegationEnabled },
      });
    }

    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
    const email = `s1022-${label}-${Date.now()}@test.local`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash('TestPass1', 10),
        isActive: true,
        member: {
          create: {
            firstName: label,
            lastName: 'User',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234567',
          },
        },
        userRoles: { create: { roleId: role.id } },
      },
      include: { member: true },
    });

    await prisma.familyMember.create({
      data: {
        familyId,
        memberId: user.member!.id,
        role: familyRole,
      },
    });
    if (familyRole === FamilyMemberRole.HEAD) {
      await prisma.family.update({
        where: { id: familyId },
        data: { headMemberId: user.member!.id },
      });
    }

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPass1' });

    return {
      token: login.body.data.accessToken as string,
      memberId: user.member!.id,
    };
  }

  async function seedSubmitted(
    memberId: string,
    familyId: string,
    suffix: string,
    createdAt?: Date,
  ) {
    return prisma.contributionRecord.create({
      data: {
        memberId,
        familyId,
        contributionType: ContributionType.OFFERING,
        contributionTypeCatalogId: catalogId,
        amount: 1000,
        claimedAmount: 1000,
        status: ContributionStatus.SUBMITTED,
        referenceNumber: `CNT-1022-${suffix}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        paymentAt: new Date(),
        paymentChannel: PaymentChannel.MOMO,
        createdAt: createdAt ?? new Date(),
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

    await grantRole(ROLES.MEMBER, [PERMISSIONS.CHOIR_CONTRIBUTION_SUBMIT]);
    await grantRole(ROLES.CHOIR_SECRETARY, [
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_FAMILY,
    ]);
    await grantRole(ROLES.CHOIR_PRESIDENT, [
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
    ]);

    const familyA = await prisma.family.create({
      data: {
        familyCode: `FAM1022A${Date.now()}`,
        familyName: 'Inbox Family A',
        delegationEnabled: false,
      },
    });
    const familyB = await prisma.family.create({
      data: {
        familyCode: `FAM1022B${Date.now()}`,
        familyName: 'Inbox Family B',
        delegationEnabled: false,
      },
    });
    familyAId = familyA.id;
    familyBId = familyB.id;

    const catalog = await prisma.contributionTypeCatalog.create({
      data: {
        code: `inbox_cat_${Date.now()}`,
        name: 'Inbox Test',
        active: true,
        ministryScope: 'CHOIR',
      },
    });
    catalogId = catalog.id;

    const headA = await createUser('headA', ROLES.MEMBER, familyAId, FamilyMemberRole.HEAD);
    headAToken = headA.token;

    const headB = await createUser('headB', ROLES.MEMBER, familyBId, FamilyMemberRole.HEAD);
    headBToken = headB.token;

    const asstOff = await createUser(
      'asstOff',
      ROLES.MEMBER,
      familyAId,
      FamilyMemberRole.ASSISTANT_HEAD,
      { delegationEnabled: false },
    );
    assistantOffToken = asstOff.token;

    await prisma.family.update({
      where: { id: familyAId },
      data: { delegationEnabled: true },
    });
    const asstOn = await createUser(
      'asstOn',
      ROLES.MEMBER,
      familyAId,
      FamilyMemberRole.ASSISTANT_HEAD,
    );
    assistantOnToken = asstOn.token;
    await prisma.family.update({
      where: { id: familyAId },
      data: { delegationEnabled: true },
    });

    const sec = await createUser(
      'sec',
      ROLES.CHOIR_SECRETARY,
      familyAId,
      FamilyMemberRole.SECRETARY,
    );
    secretaryToken = sec.token;

    const pres = await createUser('pres', ROLES.CHOIR_PRESIDENT, familyAId, FamilyMemberRole.MEMBER);
    presidentToken = pres.token;

    const memA = await createUser('memA', ROLES.MEMBER, familyAId, FamilyMemberRole.MEMBER);
    memberId = memA.memberId;
    memberToken = memA.token;
    const memB = await createUser('memB', ROLES.MEMBER, familyBId, FamilyMemberRole.MEMBER);
    memberBId = memB.memberId;
    memberBToken = memB.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('access control', () => {
    it('head sees own family inbox', async () => {
      await seedSubmitted(memberId, familyAId, 'head-own');
      const res = await request(app.getHttpServer())
        .get(`/api/v1/finance/contributions/family/inbox?familyId=${familyAId}`)
        .set('Authorization', `Bearer ${headAToken}`)
        .expect(200);
      expect(res.body.data.familyId).toBe(familyAId);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it('head cannot access another family inbox (hidden)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/finance/contributions/family/inbox?familyId=${familyBId}`)
        .set('Authorization', `Bearer ${headAToken}`)
        .expect(404);
    });

    it('assistant can view inbox when delegationEnabled=true (locked spec)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/finance/contributions/family/inbox?familyId=${familyAId}`)
        .set('Authorization', `Bearer ${assistantOnToken}`)
        .expect(200);
    });

    it('assistant can view inbox when delegationEnabled=false (per frozen SPRINT_10_2)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/finance/contributions/family/inbox?familyId=${familyAId}`)
        .set('Authorization', `Bearer ${assistantOffToken}`)
        .expect(200);
    });

    it('secretary can view inbox', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/finance/contributions/family/inbox?familyId=${familyAId}`)
        .set('Authorization', `Bearer ${secretaryToken}`)
        .expect(200);
    });

    it('secretary cannot approve', async () => {
      const row = await seedSubmitted(memberId, familyAId, 'sec-appr');
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${secretaryToken}`)
        .send({ confirmedAmount: Number(row.claimedAmount ?? row.amount) })
        .expect(403);
    });

    it('president can view inbox with familyId when view.all', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/finance/contributions/family/inbox?familyId=${familyBId}`)
        .set('Authorization', `Bearer ${presidentToken}`)
        .expect(200);
    });

    it('member never sees inbox (hidden)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/finance/contributions/family/inbox?familyId=${familyAId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(404);
    });
  });

  describe('pagination and ordering', () => {
    it('limit caps page size (pagination)', async () => {
      const base = Date.now();
      for (let i = 0; i < 5; i += 1) {
        await seedSubmitted(
          memberBId,
          familyBId,
          `page-${i}`,
          new Date(base + i * 1000),
        );
      }

      const res = await request(app.getHttpServer())
        .get(`/api/v1/finance/contributions/family/inbox?familyId=${familyBId}&limit=2`)
        .set('Authorization', `Bearer ${headBToken}`)
        .expect(200);

      expect(res.body.data.items.length).toBe(2);
      expect(res.body.data.pendingCount).toBe(2);
    });

    it('sorts oldest-first (FIFO queue per frozen spec)', async () => {
      const t1 = new Date('2026-01-01T10:00:00Z');
      const t2 = new Date('2026-01-02T10:00:00Z');
      const t3 = new Date('2026-01-03T10:00:00Z');
      const r1 = await seedSubmitted(memberBId, familyBId, 'sort-1', t1);
      const r2 = await seedSubmitted(memberBId, familyBId, 'sort-2', t2);
      const r3 = await seedSubmitted(memberBId, familyBId, 'sort-3', t3);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/finance/contributions/family/inbox?familyId=${familyBId}&limit=100`)
        .set('Authorization', `Bearer ${headBToken}`)
        .expect(200);

      const ids = (res.body.data.items as Array<{ id: string; createdAt: string }>).map(
        (i) => i.id,
      );
      const idx1 = ids.indexOf(r1.id);
      const idx2 = ids.indexOf(r2.id);
      const idx3 = ids.indexOf(r3.id);
      expect(idx1).toBeLessThan(idx2);
      expect(idx2).toBeLessThan(idx3);
    });
  });

  describe('family-scoped counts', () => {
    it('totals endpoint returns family-scoped pending aggregate', async () => {
      const totals = await request(app.getHttpServer())
        .get(`/api/v1/finance/contributions/totals?familyId=${familyAId}`)
        .set('Authorization', `Bearer ${headAToken}`)
        .expect(200);

      const dbCount = await prisma.contributionRecord.count({
        where: { familyId: familyAId, status: ContributionStatus.SUBMITTED },
      });

      expect(totals.body.data.pending.count).toBe(dbCount);
    });
  });
});
