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
import {
  CHURCH_ADMIN_OPERATIONAL_PERMISSIONS,
  PERMISSIONS,
  ROLES,
} from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Sprint 10.2.3 — approval logic (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let familyAId: string;
  let familyBId: string;
  let catalogId: string;

  let headAToken: string;
  let headBToken: string;
  let assistantOffToken: string;
  let assistantOnToken: string;
  let secretaryToken: string;
  let presidentToken: string;
  let treasurerToken: string;
  let coordinatorToken: string;
  let memberAToken: string;
  let memberAId: string;
  let memberBId: string;
  let churchAdminToken: string;

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
    familyId?: string,
    familyRole?: FamilyMemberRole,
  ) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
    const email = `s1023-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@test.local`;
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

    if (familyId && familyRole) {
      await prisma.familyMember.create({
        data: { familyId, memberId: user.member!.id, role: familyRole },
      });
      if (familyRole === FamilyMemberRole.HEAD) {
        await prisma.family.update({
          where: { id: familyId },
          data: { headMemberId: user.member!.id },
        });
      }
    }

    const token = await jwtService.signAsync({
      sub: user.id,
      email,
    });

    return {
      token,
      memberId: user.member!.id,
    };
  }

  async function createSubmitted(
    memberId: string,
    familyId: string,
    claimedAmount: number,
  ) {
    return prisma.contributionRecord.create({
      data: {
        memberId,
        familyId,
        contributionType: ContributionType.OFFERING,
        contributionTypeCatalogId: catalogId,
        amount: claimedAmount,
        claimedAmount,
        status: ContributionStatus.SUBMITTED,
        referenceNumber: `CNT-1023-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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

    await grantRole(ROLES.MEMBER, [PERMISSIONS.CHOIR_CONTRIBUTION_SUBMIT]);
    await grantRole(ROLES.CHOIR_SECRETARY, [
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_FAMILY,
    ]);
    await grantRole(ROLES.CHOIR_PRESIDENT, [
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
      PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
    ]);
    await grantRole(ROLES.CHOIR_TREASURER, [
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
      PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
    ]);
    await grantRole(ROLES.CHOIR_FAMILY_COORDINATOR, [
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
      PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
    ]);
    await grantRole(ROLES.CHURCH_ADMIN, [...CHURCH_ADMIN_OPERATIONAL_PERMISSIONS]);

    const familyA = await prisma.family.create({
      data: {
        familyCode: `FAM1023A${Date.now()}`,
        familyName: 'Approval A',
        delegationEnabled: false,
      },
    });
    const familyB = await prisma.family.create({
      data: {
        familyCode: `FAM1023B${Date.now()}`,
        familyName: 'Approval B',
        delegationEnabled: true,
      },
    });
    familyAId = familyA.id;
    familyBId = familyB.id;

    const catalog = await prisma.contributionTypeCatalog.create({
      data: {
        code: `appr_cat_${Date.now()}`,
        name: 'Approval Test',
        active: true,
        ministryScope: 'CHOIR',
      },
    });
    catalogId = catalog.id;

    headAToken = (await createUser('headA', ROLES.MEMBER, familyAId, FamilyMemberRole.HEAD)).token;
    headBToken = (await createUser('headB', ROLES.MEMBER, familyBId, FamilyMemberRole.HEAD)).token;
    assistantOffToken = (
      await createUser('asstOff', ROLES.MEMBER, familyAId, FamilyMemberRole.ASSISTANT_HEAD)
    ).token;
    await prisma.family.update({
      where: { id: familyBId },
      data: { delegationEnabled: true },
    });
    assistantOnToken = (
      await createUser('asstOn', ROLES.MEMBER, familyBId, FamilyMemberRole.ASSISTANT_HEAD)
    ).token;
    secretaryToken = (
      await createUser('sec', ROLES.CHOIR_SECRETARY, familyAId, FamilyMemberRole.SECRETARY)
    ).token;
    presidentToken = (await createUser('pres', ROLES.CHOIR_PRESIDENT)).token;
    treasurerToken = (await createUser('tres', ROLES.CHOIR_TREASURER)).token;
    coordinatorToken = (
      await createUser('coord', ROLES.CHOIR_FAMILY_COORDINATOR)
    ).token;
    const memA = await createUser('memA', ROLES.MEMBER, familyAId, FamilyMemberRole.MEMBER);
    memberAToken = memA.token;
    memberAId = memA.memberId;
    const memB = await createUser('memB', ROLES.MEMBER, familyBId, FamilyMemberRole.MEMBER);
    memberBId = memB.memberId;
    churchAdminToken = (await createUser('cadmin', ROLES.CHURCH_ADMIN)).token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Suite 3 — approval & rejection', () => {
    it('head approves with matching confirmed amount', async () => {
      const row = await createSubmitted(memberAId, familyAId, 10000);
      const res = await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${headAToken}`)
        .send({ confirmedAmount: 10000 })
        .expect(201);

      expect(res.body.data.status).toBe('CONFIRMED');
      expect(res.body.data.confirmedAmount).toBe(10000);
      expect(res.body.data.claimedAmount).toBe(10000);

      const db = await prisma.contributionRecord.findUniqueOrThrow({
        where: { id: row.id },
      });
      expect(Number(db.claimedAmount)).toBe(10000);
      expect(Number(db.confirmedAmount)).toBe(10000);
      expect(db.familyApprovedByMemberId).toBeTruthy();
    });

    it('assistant approves when delegation enabled', async () => {
      const row = await createSubmitted(memberBId, familyBId, 5000);
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${assistantOnToken}`)
        .send({ confirmedAmount: 5000 })
        .expect(201);
    });

    it('assistant denied approve when delegation disabled', async () => {
      const row = await createSubmitted(memberAId, familyAId, 4000);
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${assistantOffToken}`)
        .send({ confirmedAmount: 4000 })
        .expect(403);
    });

    it('secretary denied approve', async () => {
      const row = await createSubmitted(memberAId, familyAId, 3000);
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${secretaryToken}`)
        .send({ confirmedAmount: 3000 })
        .expect(403);
    });

    it('treasurer denied approve', async () => {
      const row = await createSubmitted(memberAId, familyAId, 3000);
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${treasurerToken}`)
        .send({ confirmedAmount: 3000 })
        .expect(403);
    });

    it('president denied approve without family role', async () => {
      const row = await createSubmitted(memberAId, familyAId, 3000);
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${presidentToken}`)
        .send({ confirmedAmount: 3000 })
        .expect(403);
    });

    it('coordinator denied approve', async () => {
      const row = await createSubmitted(memberAId, familyAId, 3000);
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({ confirmedAmount: 3000 })
        .expect(403);
    });

    it('church admin denied approve', async () => {
      const row = await createSubmitted(memberAId, familyAId, 3000);
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${churchAdminToken}`)
        .send({ confirmedAmount: 3000 })
        .expect(403);
    });

    it('head cannot approve another family submission', async () => {
      const memB = await prisma.familyMember.findFirstOrThrow({
        where: { familyId: familyBId },
      });
      const row = await createSubmitted(memB.memberId, familyBId, 2000);
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${headAToken}`)
        .send({ confirmedAmount: 2000 })
        .expect(403);
    });

    it('discrepancy requires reason', async () => {
      const row = await createSubmitted(memberAId, familyAId, 10000);
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${headAToken}`)
        .send({ confirmedAmount: 7000 })
        .expect(400);
    });

    it('discrepancy with reason succeeds', async () => {
      const row = await createSubmitted(memberAId, familyAId, 10000);
      const res = await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${headAToken}`)
        .send({
          confirmedAmount: 7000,
          discrepancyReason: 'MoMo delay verified',
        })
        .expect(201);

      expect(res.body.data.discrepancyReason).toBe('MoMo delay verified');
      expect(res.body.data.discrepancyAmount).toBe(3000);
    });

    it('reject requires reason', async () => {
      const row = await createSubmitted(memberAId, familyAId, 8000);
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/reject`)
        .set('Authorization', `Bearer ${headAToken}`)
        .send({})
        .expect(400);
    });

    it('head rejects with reason', async () => {
      const row = await createSubmitted(memberAId, familyAId, 8000);
      const res = await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/reject`)
        .set('Authorization', `Bearer ${headAToken}`)
        .send({ rejectionReason: 'Receipt unclear' })
        .expect(201);

      expect(res.body.data.status).toBe('REJECTED');
      expect(res.body.data.rejectionReason).toBe('Receipt unclear');
    });

    it('double approve blocked with 409', async () => {
      const row = await createSubmitted(memberAId, familyAId, 6000);
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${headAToken}`)
        .send({ confirmedAmount: 6000 })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${headAToken}`)
        .send({ confirmedAmount: 6000 })
        .expect(409);
    });

    it('reject on confirmed blocked with 409', async () => {
      const row = await createSubmitted(memberAId, familyAId, 6000);
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${headAToken}`)
        .send({ confirmedAmount: 6000 })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/reject`)
        .set('Authorization', `Bearer ${headAToken}`)
        .send({ rejectionReason: 'Too late' })
        .expect(409);
    });

    it('CONTRIBUTION_CONFIRMED audit written', async () => {
      const row = await createSubmitted(memberAId, familyAId, 9000);
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
        .set('Authorization', `Bearer ${headAToken}`)
        .send({ confirmedAmount: 9000 })
        .expect(201);

      const audit = await prisma.auditLog.findFirst({
        where: { action: 'CONTRIBUTION_CONFIRMED', entityId: row.id },
      });
      const payload = audit?.newValue as Record<string, unknown>;
      expect(payload.claimedAmount).toBe(9000);
      expect(payload.confirmedAmount).toBe(9000);
      expect(payload.approverId).toBeDefined();
      expect(payload.approverRole).toBe('FAMILY_HEAD');
      expect(payload.familyId).toBe(familyAId);
      expect(payload.memberId).toBe(memberAId);
    });

    it('CONTRIBUTION_REJECTED audit written', async () => {
      const row = await createSubmitted(memberAId, familyAId, 4500);
      await request(app.getHttpServer())
        .post(`/api/v1/finance/contributions/${row.id}/family/reject`)
        .set('Authorization', `Bearer ${headAToken}`)
        .send({ rejectionReason: 'Not accepted' })
        .expect(201);

      const audit = await prisma.auditLog.findFirst({
        where: { action: 'CONTRIBUTION_REJECTED', entityId: row.id },
      });
      const payload = audit?.newValue as Record<string, unknown>;
      expect(payload.rejectionReason).toBe('Not accepted');
      expect(payload.actorRole).toBe('FAMILY_HEAD');
    });
  });
});
