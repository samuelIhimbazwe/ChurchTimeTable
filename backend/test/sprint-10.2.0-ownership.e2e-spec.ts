import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import {
  ContributionAdjustmentCategory,
  ContributionStatus,
  ContributionType,
  FamilyMemberRole,
  MemberStatus,
} from '@prisma/client';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import {
  CHURCH_ADMIN_ACCOUNT_PERMISSIONS,
  PERMISSIONS,
  ROLES,
} from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';

type TestUser = {
  email: string;
  token: string;
  memberId: string;
};

describe('Sprint 10.2.0 — data ownership (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let familyAId: string;
  let familyBId: string;
  let confirmedFamilyAId: string;
  let confirmedFamilyBId: string;
  let submittedFamilyAId: string;

  let member: TestUser;
  let secretary: TestUser;
  let assistant: TestUser;
  let head: TestUser;
  let president: TestUser;
  let treasurer: TestUser;
  let coordinator: TestUser;
  let churchAdmin: TestUser;

  async function grantRolePermissions(
    roleName: string,
    permissionCodes: string[],
  ) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      create: { name: roleName, description: roleName },
      update: {},
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const code of permissionCodes) {
      const permission = await prisma.permission.upsert({
        where: { code },
        create: { code, description: code },
        update: {},
      });
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: permission.id },
      });
    }
    return role;
  }

  async function createUser(
    label: string,
    roleName: string,
    options?: {
      familyId?: string;
      familyRole?: FamilyMemberRole;
      extraPermissions?: string[];
    },
  ): Promise<TestUser> {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
    const email = `s10-20-${label}-${Date.now()}@test.local`;
    const passwordHash = await bcrypt.hash('TestPass1', 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: label,
            lastName: 'Test',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: `078${String(Date.now()).slice(-7)}`,
          },
        },
        userRoles: { create: { roleId: role.id } },
      },
      include: { member: true },
    });

    const memberId = user.member!.id;

    if (options?.extraPermissions?.length) {
      for (const code of options.extraPermissions) {
        const permission = await prisma.permission.upsert({
          where: { code },
          create: { code, description: code },
          update: {},
        });
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: permission.id },
        });
      }
    }

    if (options?.familyId && options.familyRole) {
      await prisma.familyMember.create({
        data: {
          familyId: options.familyId,
          memberId,
          role: options.familyRole,
        },
      });
      if (options.familyRole === FamilyMemberRole.HEAD) {
        await prisma.family.update({
          where: { id: options.familyId },
          data: { headMemberId: memberId },
        });
      }
    }

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPass1' });

    return {
      email,
      token: login.body.data.accessToken as string,
      memberId,
    };
  }

  async function createConfirmedContribution(
    memberId: string,
    familyId: string,
    confirmedAmount: number,
  ) {
    return prisma.contributionRecord.create({
      data: {
        memberId,
        familyId,
        contributionType: ContributionType.OFFERING,
        amount: confirmedAmount,
        claimedAmount: confirmedAmount,
        confirmedAmount,
        status: ContributionStatus.CONFIRMED,
        referenceNumber: `CNT-TST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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

    await grantRolePermissions(ROLES.MEMBER, [
      PERMISSIONS.CHOIR_CONTRIBUTION_SUBMIT,
    ]);
    await grantRolePermissions(ROLES.CHOIR_SECRETARY, [
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_FAMILY,
    ]);
    await grantRolePermissions(ROLES.CHOIR_PRESIDENT, [
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
      PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
    ]);
    await grantRolePermissions(ROLES.CHOIR_TREASURER, [
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
      PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
    ]);
    await grantRolePermissions(ROLES.CHOIR_FAMILY_COORDINATOR, [
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
      PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
      PERMISSIONS.CHOIR_FAMILY_VIEW,
    ]);
    await grantRolePermissions(ROLES.CHURCH_ADMIN, [
      ...CHURCH_ADMIN_ACCOUNT_PERMISSIONS,
    ]);

    const familyA = await prisma.family.create({
      data: {
        familyCode: `FAM${Date.now()}A`,
        familyName: 'Ownership Family A',
        delegationEnabled: false,
      },
    });
    const familyB = await prisma.family.create({
      data: {
        familyCode: `FAM${Date.now()}B`,
        familyName: 'Ownership Family B',
        delegationEnabled: false,
      },
    });
    familyAId = familyA.id;
    familyBId = familyB.id;

    member = await createUser('member', ROLES.MEMBER, {
      familyId: familyAId,
      familyRole: FamilyMemberRole.MEMBER,
    });
    secretary = await createUser('secretary', ROLES.CHOIR_SECRETARY, {
      familyId: familyAId,
      familyRole: FamilyMemberRole.SECRETARY,
    });
    assistant = await createUser('assistant', ROLES.MEMBER, {
      familyId: familyAId,
      familyRole: FamilyMemberRole.ASSISTANT_HEAD,
    });
    head = await createUser('head', ROLES.MEMBER, {
      familyId: familyAId,
      familyRole: FamilyMemberRole.HEAD,
    });
    president = await createUser('president', ROLES.CHOIR_PRESIDENT);
    treasurer = await createUser('treasurer', ROLES.CHOIR_TREASURER);
    coordinator = await createUser('coordinator', ROLES.CHOIR_FAMILY_COORDINATOR);
    churchAdmin = await createUser('churchadmin', ROLES.CHURCH_ADMIN);

    const confirmedA = await createConfirmedContribution(
      member.memberId,
      familyAId,
      10000,
    );
    confirmedFamilyAId = confirmedA.id;

    const confirmedB = await createConfirmedContribution(
      member.memberId,
      familyBId,
      5000,
    );
    confirmedFamilyBId = confirmedB.id;

    const submitted = await prisma.contributionRecord.create({
      data: {
        memberId: member.memberId,
        familyId: familyAId,
        contributionType: ContributionType.OFFERING,
        amount: 3000,
        claimedAmount: 3000,
        status: ContributionStatus.SUBMITTED,
        referenceNumber: `CNT-SUB-${Date.now()}`,
      },
    });
    submittedFamilyAId = submitted.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Suite 0 — Data ownership audit', () => {
    it('0.1 member cannot access family inbox', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/finance/contributions/family/inbox?familyId=${familyAId}`)
        .set('Authorization', `Bearer ${member.token}`)
        .expect(404);
    });

    it('0.2 member cannot access family totals', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/finance/contributions/totals?familyId=${familyAId}`)
        .set('Authorization', `Bearer ${member.token}`)
        .expect(404);
    });

    it('0.3 member cannot list all contributions', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/finance/contributions')
        .set('Authorization', `Bearer ${member.token}`)
        .expect(404);
    });

    it('0.4 secretary cannot approve', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${submittedFamilyAId}/family/approve`)
        .set('Authorization', `Bearer ${secretary.token}`)
        .send({ confirmedAmount: 3000 })
        .expect(403);
    });

    it('0.5 secretary cannot adjust', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${confirmedFamilyAId}/adjust`)
        .set('Authorization', `Bearer ${secretary.token}`)
        .send({
          adjustmentAmount: -100,
          category: ContributionAdjustmentCategory.CORRECTION,
          reason: 'Should be denied',
        })
        .expect(403);
    });

    it('0.6 assistant cannot approve when delegation disabled', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${submittedFamilyAId}/family/approve`)
        .set('Authorization', `Bearer ${assistant.token}`)
        .send({ confirmedAmount: 3000 })
        .expect(403);
    });

    it('0.7 treasurer cannot approve', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${submittedFamilyAId}/family/approve`)
        .set('Authorization', `Bearer ${treasurer.token}`)
        .send({ confirmedAmount: 3000 })
        .expect(403);
    });

    it('0.8 president cannot approve without family leadership', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${submittedFamilyAId}/family/approve`)
        .set('Authorization', `Bearer ${president.token}`)
        .send({ confirmedAmount: 3000 })
        .expect(403);
    });

    it('0.9 president can adjust with category', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${confirmedFamilyAId}/adjust`)
        .set('Authorization', `Bearer ${president.token}`)
        .send({
          adjustmentAmount: 500,
          category: ContributionAdjustmentCategory.CORRECTION,
          reason: 'Executive correction',
        })
        .expect(201);

      expect(res.body.data.effectiveAmount).toBe(10500);
    });

    it('0.10 head cannot adjust another family record', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${confirmedFamilyBId}/adjust`)
        .set('Authorization', `Bearer ${head.token}`)
        .send({
          adjustmentAmount: -100,
          category: ContributionAdjustmentCategory.CORRECTION,
          reason: 'Cross-family denied',
        })
        .expect(403);
    });

    it('0.11 head can adjust own family record', async () => {
      const record = await createConfirmedContribution(
        member.memberId,
        familyAId,
        8000,
      );

      const res = await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${record.id}/adjust`)
        .set('Authorization', `Bearer ${head.token}`)
        .send({
          adjustmentAmount: -500,
          category: ContributionAdjustmentCategory.CORRECTION,
          reason: 'Family head correction',
        })
        .expect(201);

      expect(res.body.data.effectiveAmount).toBe(7500);
    });

    it('0.12 coordinator can access family inbox', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/finance/contributions/family/inbox?familyId=${familyAId}`)
        .set('Authorization', `Bearer ${coordinator.token}`)
        .expect(200);
    });

    it('0.13 church admin cannot access member contributions', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/finance/contributions/mine')
        .set('Authorization', `Bearer ${churchAdmin.token}`)
        .expect(403);
    });

    it('0.14 adjust without category is rejected', async () => {
      const record = await createConfirmedContribution(
        member.memberId,
        familyAId,
        4000,
      );

      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${record.id}/adjust`)
        .set('Authorization', `Bearer ${treasurer.token}`)
        .send({
          adjustmentAmount: 100,
          reason: 'Missing category',
        })
        .expect(400);
    });

    it('0.15 adjustment audit contains required fields', async () => {
      const record = await createConfirmedContribution(
        member.memberId,
        familyAId,
        6000,
      );

      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${record.id}/adjust`)
        .set('Authorization', `Bearer ${treasurer.token}`)
        .send({
          adjustmentAmount: 1000,
          category: ContributionAdjustmentCategory.CORRECTION,
          reason: 'Audit trail validation',
        })
        .expect(201);

      const audit = await prisma.auditLog.findFirst({
        where: {
          action: 'CONTRIBUTION_ADJUST',
          entityId: { not: null },
        },
        orderBy: { createdAt: 'desc' },
      });

      const payload = audit?.newValue as Record<string, unknown>;
      expect(payload.adjustmentAmount).toBe(1000);
      expect(payload.category).toBe('CORRECTION');
      expect(payload.reason).toBe('Audit trail validation');
      expect(payload.actorId).toBeDefined();
      expect(payload.actorRole).toBeDefined();
      expect(payload.timestamp).toBeDefined();
      expect(payload.contributionRecordId).toBe(record.id);
      expect(payload.adjustmentId).toBeDefined();
      expect(payload.confirmedAmount).toBe(6000);
      expect(payload.effectiveAmountBefore).toBe(6000);
      expect(payload.effectiveAmountAfter).toBe(7000);
    });
  });
});
