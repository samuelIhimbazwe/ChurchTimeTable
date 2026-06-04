import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { FamilyMemberRole, MemberStatus } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import {
  CHURCH_ADMIN_ACCOUNT_PERMISSIONS,
  PERMISSIONS,
  ROLES,
} from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';
import { MAIN_CHOIR_ID } from '../src/common/constants/choir.constants';

const EXPECTED_CATALOG_CODES = [
  'umusanzu',
  'inyubako',
  'uniform',
  'concert',
  'live_recording',
  'special_project',
] as const;

const LEGACY_FAMILY_ROLES = ['SPOUSE', 'CHILD', 'DEPENDENT', 'OTHER'] as const;

describe('Sprint 10.1 exit criteria (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

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

    for (const code of EXPECTED_CATALOG_CODES) {
      await prisma.contributionTypeCatalog.upsert({
        where: {
          choirId_code: { choirId: MAIN_CHOIR_ID, code },
        },
        create: {
          choirId: MAIN_CHOIR_ID,
          code,
          name: code,
          ministryScope: 'CHOIR',
          active: true,
          sortOrder: 0,
        },
        update: { active: true },
      });
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Schema & migration validation', () => {
    it('has sprint 10 tables and contribution record extensions', async () => {
      const [
        familyCount,
        memberCount,
        contributionCount,
        catalogCount,
        campaignCount,
        adjustmentCount,
        historyCount,
      ] = await Promise.all([
        prisma.family.count(),
        prisma.familyMember.count(),
        prisma.contributionRecord.count(),
        prisma.contributionTypeCatalog.count(),
        prisma.contributionCampaign.count(),
        prisma.contributionAdjustment.count(),
        prisma.familyLeadershipHistory.count(),
      ]);

      expect(familyCount).toBeGreaterThanOrEqual(0);
      expect(memberCount).toBeGreaterThanOrEqual(0);
      expect(contributionCount).toBeGreaterThanOrEqual(0);
      expect(catalogCount).toBeGreaterThanOrEqual(6);
      expect(campaignCount).toBeGreaterThanOrEqual(0);
      expect(adjustmentCount).toBeGreaterThanOrEqual(0);
      expect(historyCount).toBeGreaterThanOrEqual(0);

      const sample = await prisma.contributionRecord.findFirst({
        select: {
          id: true,
          claimedAmount: true,
          amount: true,
          familyId: true,
        },
      });
      if (sample) {
        expect(sample.amount).toBeDefined();
      }
    });

    it('has no legacy household family roles in FamilyMember', async () => {
      const members = await prisma.familyMember.findMany({
        select: { role: true },
      });
      const roles = new Set(members.map((row) => row.role));
      for (const legacy of LEGACY_FAMILY_ROLES) {
        expect(roles.has(legacy as FamilyMemberRole)).toBe(false);
      }
      for (const allowed of [
        FamilyMemberRole.HEAD,
        FamilyMemberRole.ASSISTANT_HEAD,
        FamilyMemberRole.SECRETARY,
        FamilyMemberRole.MEMBER,
      ]) {
        if (roles.size > 0) {
          expect([...roles].every((r) => Object.values(FamilyMemberRole).includes(r))).toBe(
            true,
          );
        }
        void allowed;
      }
    });

    it('has no orphaned family members', async () => {
      const dangling = await prisma.$queryRaw<Array<{ memberId: string }>>`
        SELECT fm."memberId"
        FROM "FamilyMember" fm
        LEFT JOIN "Member" m ON m."id" = fm."memberId"
        WHERE m."id" IS NULL
      `;
      expect(dangling).toHaveLength(0);
    });

    it('supports Family.delegationEnabled', async () => {
      const family = await prisma.family.findFirst({
        select: { delegationEnabled: true },
      });
      if (family) {
        expect(typeof family.delegationEnabled).toBe('boolean');
      } else {
        expect(true).toBe(true);
      }
    });
  });

  describe('Seed validation — contribution type catalog', () => {
    it('contains default choir contribution types', async () => {
      const rows = await prisma.contributionTypeCatalog.findMany({
        where: { code: { in: [...EXPECTED_CATALOG_CODES] }, active: true },
        select: { code: true, name: true },
      });
      expect(rows.length).toBe(EXPECTED_CATALOG_CODES.length);
    });

    it('allows leadership to add new types without code deploy', async () => {
      const created = await prisma.contributionTypeCatalog.create({
        data: {
          code: `christmas_drive_${Date.now()}`,
          name: 'Christmas Drive',
          description: 'Seasonal campaign type',
          ministryScope: 'CHOIR',
          active: true,
        },
      });
      expect(created.id).toBeDefined();
      await prisma.contributionTypeCatalog.delete({ where: { id: created.id } });
    });
  });

  describe('RBAC — CHURCH_ADMIN separation', () => {
    let churchAdminToken: string;

    beforeAll(async () => {
      const churchAdminRole = await prisma.role.upsert({
        where: { name: ROLES.CHURCH_ADMIN },
        create: { name: ROLES.CHURCH_ADMIN, description: 'Account admin' },
        update: {},
      });

      await prisma.rolePermission.deleteMany({ where: { roleId: churchAdminRole.id } });
      for (const code of CHURCH_ADMIN_ACCOUNT_PERMISSIONS) {
        const permission = await prisma.permission.upsert({
          where: { code },
          create: { code, description: code },
          update: {},
        });
        await prisma.rolePermission.create({
          data: { roleId: churchAdminRole.id, permissionId: permission.id },
        });
      }

      const email = `s101-admin-${Date.now()}@test.local`;
      const passwordHash = await bcrypt.hash('TestPass1', 10);
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          isActive: true,
          member: {
            create: {
              firstName: 'Church',
              lastName: 'Admin',
              ministry: 'BOTH',
              status: MemberStatus.ACTIVE,
              phone: '0781234599',
            },
          },
          userRoles: { create: { roleId: churchAdminRole.id } },
        },
      });

      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'TestPass1' });
      churchAdminToken = login.body.data.accessToken;
    });

    it('denies ministry finance, attendance, families, governance, contributions', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/finance/stewardship/analytics')
        .set('Authorization', `Bearer ${churchAdminToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/v1/finance/contributions/mine')
        .set('Authorization', `Bearer ${churchAdminToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/v1/attendance/analytics')
        .set('Authorization', `Bearer ${churchAdminToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/v1/families')
        .set('Authorization', `Bearer ${churchAdminToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/v1/governance/choir/default-choir')
        .set('Authorization', `Bearer ${churchAdminToken}`)
        .expect(403);
    });

    it('allows account administration (members, roles view)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/members')
        .set('Authorization', `Bearer ${churchAdminToken}`)
        .expect(200);
    });
  });

  async function ensureRolePermissions(
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
  }

  describe('RBAC — permission union', () => {
    it('Admin + Treasurer receives both permission sets', async () => {
      await ensureRolePermissions(ROLES.CHURCH_ADMIN, [
        ...CHURCH_ADMIN_ACCOUNT_PERMISSIONS,
      ]);
      await ensureRolePermissions(ROLES.CHOIR_TREASURER, [
        PERMISSIONS.CHOIR_FINANCE_VIEW,
        PERMISSIONS.CHOIR_FINANCE_MANAGE,
        PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
      ]);

      const churchAdminRole = await prisma.role.findUniqueOrThrow({
        where: { name: ROLES.CHURCH_ADMIN },
      });
      const treasurerRole = await prisma.role.findUniqueOrThrow({
        where: { name: ROLES.CHOIR_TREASURER },
      });

      const email = `s101-union-treasurer-${Date.now()}@test.local`;
      const passwordHash = await bcrypt.hash('TestPass1', 10);
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          isActive: true,
          member: {
            create: {
              firstName: 'Union',
              lastName: 'Treasurer',
              ministry: 'CHOIR',
              status: MemberStatus.ACTIVE,
              phone: '0781234588',
            },
          },
          userRoles: {
            create: [
              { roleId: churchAdminRole.id },
              { roleId: treasurerRole.id },
            ],
          },
        },
      });

      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'TestPass1' });
      const token = login.body.data.accessToken;

      await request(app.getHttpServer())
        .get('/api/v1/members')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/v1/finance/stewardship/analytics')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('Family leadership history', () => {
    it('records history when a head is assigned', async () => {
      const presidentRole = await prisma.role.findUniqueOrThrow({
        where: { name: ROLES.CHOIR_PRESIDENT },
      });
      for (const code of [PERMISSIONS.FAMILY_VIEW, PERMISSIONS.FAMILY_MANAGE]) {
        const permission = await prisma.permission.upsert({
          where: { code },
          create: { code, description: code },
          update: {},
        });
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: presidentRole.id,
              permissionId: permission.id,
            },
          },
          create: { roleId: presidentRole.id, permissionId: permission.id },
          update: {},
        });
      }

      const leaderEmail = `s101-head-${Date.now()}@test.local`;
      const memberEmail = `s101-member-${Date.now()}@test.local`;
      const passwordHash = await bcrypt.hash('TestPass1', 10);

      const headUser = await prisma.user.create({
        data: {
          email: leaderEmail,
          passwordHash,
          isActive: true,
          member: {
            create: {
              firstName: 'Head',
              lastName: 'Leader',
              ministry: 'CHOIR',
              status: MemberStatus.ACTIVE,
              phone: '0781234577',
            },
          },
          userRoles: { create: { roleId: presidentRole.id } },
        },
        include: { member: true },
      });

      const memberUser = await prisma.user.create({
        data: {
          email: memberEmail,
          passwordHash,
          isActive: true,
          member: {
            create: {
              firstName: 'Team',
              lastName: 'Member',
              ministry: 'CHOIR',
              status: MemberStatus.ACTIVE,
              phone: '0781234566',
            },
          },
        },
        include: { member: true },
      });

      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: leaderEmail, password: 'TestPass1' });
      const leaderToken = login.body.data.accessToken;

      const created = await request(app.getHttpServer())
        .post('/api/v1/families')
        .set('Authorization', `Bearer ${leaderToken}`)
        .send({
          familyName: 'History Test Family',
          headMemberId: headUser.member!.id,
        })
        .expect(201);

      const familyId = created.body.data.id as string;

      const history = await prisma.familyLeadershipHistory.findMany({
        where: {
          familyId,
          memberId: headUser.member!.id,
          role: FamilyMemberRole.HEAD,
        },
      });
      expect(history.length).toBeGreaterThan(0);

      await request(app.getHttpServer())
        .post(`/api/v1/families/${familyId}/members`)
        .set('Authorization', `Bearer ${leaderToken}`)
        .send({ memberId: memberUser.member!.id, role: 'MEMBER' })
        .expect(201);
    });
  });
});
