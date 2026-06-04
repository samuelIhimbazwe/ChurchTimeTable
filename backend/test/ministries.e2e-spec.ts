import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { MemberStatus } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { ROLES, PERMISSIONS } from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';
import { MINISTRY_AUDIT_ACTIONS } from '../src/ministries/ministry.constants';

describe('Ministries MF-1 (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let memberToken: string;
  let memberAId: string;
  let memberBId: string;
  let musicMinistryId: string;
  let youthMinistryId: string;

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

    const prisma = app.get(PrismaService);

    const music = await prisma.ministry.findUniqueOrThrow({
      where: { code: 'MUSIC' },
    });
    const youth = await prisma.ministry.findUniqueOrThrow({
      where: { code: 'YOUTH' },
    });
    musicMinistryId = music.id;
    youthMinistryId = youth.id;

    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.SUPER_ADMIN },
    });
    const memberRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.MEMBER },
    });

    const ministryPerms = [
      PERMISSIONS.MINISTRY_MEMBER_MANAGE,
      PERMISSIONS.MINISTRY_LEADERSHIP_MANAGE,
    ];
    for (const code of ministryPerms) {
      const permission = await prisma.permission.upsert({
        where: { code },
        create: { code, description: code },
        update: {},
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: memberRole.id,
            permissionId: permission.id,
          },
        },
        create: { roleId: memberRole.id, permissionId: permission.id },
        update: {},
      });
    }

    const passwordHash = await bcrypt.hash('TestPass1', 10);
    const ts = Date.now();

    await prisma.user.create({
      data: {
        email: `ministry-admin-${ts}@test.local`,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Ministry',
            lastName: 'Admin',
            ministry: 'BOTH',
            status: MemberStatus.ACTIVE,
            phone: `0789${String(ts).slice(-6)}`,
          },
        },
        userRoles: { create: { roleId: adminRole.id } },
      },
    });

    const memberUser = await prisma.user.create({
      data: {
        email: `ministry-member-${ts}@test.local`,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Ministry',
            lastName: 'MemberA',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: `0788${String(ts).slice(-6)}`,
          },
        },
        userRoles: { create: { roleId: memberRole.id } },
      },
      include: { member: true },
    });
    memberAId = memberUser.member!.id;

    const memberB = await prisma.member.create({
      data: {
        firstName: 'Ministry',
        lastName: 'MemberB',
        ministry: 'CHOIR',
        status: MemberStatus.ACTIVE,
        phone: `0787${String(ts).slice(-6)}`,
        user: {
          create: {
            email: `ministry-memberb-${ts}@test.local`,
            passwordHash,
            isActive: true,
            userRoles: { create: { roleId: memberRole.id } },
          },
        },
      },
    });
    memberBId = memberB.id;

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: `ministry-admin-${ts}@test.local`, password: 'TestPass1' });
    adminToken = adminLogin.body.data.accessToken;

    const memberLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: `ministry-member-${ts}@test.local`, password: 'TestPass1' });
    memberToken = memberLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists seeded ministries', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/ministries')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(8);
    expect(res.body.data.some((m: { code: string }) => m.code === 'MUSIC')).toBe(true);
  });

  it('creates and updates a ministry', async () => {
    const code = `TEST_${Date.now()}`;
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/ministries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code,
        name: `Test Ministry ${code}`,
        description: 'MF-1 test ministry',
      });
    expect(createRes.status).toBe(201);
    const ministryId = createRes.body.data.id;

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/v1/ministries/${ministryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Updated description' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.description).toBe('Updated description');

    const audit = await app.get(PrismaService).auditLog.findFirst({
      where: {
        action: MINISTRY_AUDIT_ACTIONS.CREATED,
        entityId: ministryId,
      },
    });
    expect(audit).toBeTruthy();
  });

  it('manages membership with soft removal', async () => {
    const addRes = await request(app.getHttpServer())
      .post(`/api/v1/ministries/${musicMinistryId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberId: memberAId });
    expect(addRes.status).toBe(201);

    const listRes = await request(app.getHttpServer())
      .get(`/api/v1/ministries/${musicMinistryId}/members`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((r: { memberId: string }) => r.memberId === memberAId)).toBe(
      true,
    );

    const removeRes = await request(app.getHttpServer())
      .delete(`/api/v1/ministries/${musicMinistryId}/members/${memberAId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(removeRes.status).toBe(200);
    expect(removeRes.body.data.status).toBe('REMOVED');
  });

  it('assigns leadership and preserves history', async () => {
    const position = await app.get(PrismaService).ministryLeadershipPosition.findFirstOrThrow({
      where: { ministryId: musicMinistryId, name: 'President' },
    });

    const assignRes = await request(app.getHttpServer())
      .post(`/api/v1/ministries/${musicMinistryId}/leadership`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberId: memberBId, positionId: position.id });
    expect(assignRes.status).toBe(201);
    const assignmentId = assignRes.body.data.id;

    const endRes = await request(app.getHttpServer())
      .patch(`/api/v1/ministries/${musicMinistryId}/leadership/${assignmentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(endRes.status).toBe(200);
    expect(endRes.body.data.endedAt).toBeTruthy();

    const leadership = await request(app.getHttpServer())
      .get(`/api/v1/ministries/${musicMinistryId}/leadership`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(leadership.status).toBe(200);
    expect(leadership.body.data.history.some((a: { id: string }) => a.id === assignmentId)).toBe(
      true,
    );
  });

  it('grants and revokes ministry permissions', async () => {
    const grantRes = await request(app.getHttpServer())
      .post(`/api/v1/ministries/${musicMinistryId}/permissions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberId: memberAId, permission: 'ministry.member.view' });
    expect(grantRes.status).toBe(201);
    const assignmentId = grantRes.body.data.id;

    const listRes = await request(app.getHttpServer())
      .get(`/api/v1/ministries/${musicMinistryId}/permissions`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((r: { id: string }) => r.id === assignmentId)).toBe(true);

    const revokeRes = await request(app.getHttpServer())
      .delete(`/api/v1/ministries/${musicMinistryId}/permissions/${assignmentId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.data.revokedAt).toBeTruthy();
  });

  it('enforces cross-ministry isolation for scoped viewers', async () => {
    await app.get(PrismaService).ministryMembership.create({
      data: {
        ministryId: youthMinistryId,
        memberId: memberAId,
        status: 'ACTIVE',
      },
    });

    await app.get(PrismaService).ministryPermissionAssignment.create({
      data: {
        ministryId: youthMinistryId,
        memberId: memberAId,
        permission: 'ministry.member.view',
      },
    });

    const prisma = app.get(PrismaService);
    const memberUser = await prisma.member.findUniqueOrThrow({
      where: { id: memberAId },
      include: { user: true },
    });

    const relogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: memberUser.user.email, password: 'TestPass1' });
    const scopedToken = relogin.body.data.accessToken;

    const visible = await request(app.getHttpServer())
      .get('/api/v1/ministries')
      .set('Authorization', `Bearer ${scopedToken}`);
    expect(visible.status).toBe(200);
    const ids = visible.body.data.map((m: { id: string }) => m.id);
    expect(ids).toContain(youthMinistryId);
    expect(ids).not.toContain(musicMinistryId);
  });

  it('returns ministry summary', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/ministries/${musicMinistryId}/summary`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.ministryId).toBe(musicMinistryId);
    expect(typeof res.body.data.memberCount).toBe('number');
  });

  it('updates settings with audit', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/ministries/${musicMinistryId}/settings`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ allowOperationalUnits: false });
    expect(res.status).toBe(200);
    expect(res.body.data.allowOperationalUnits).toBe(false);

    const audit = await app.get(PrismaService).auditLog.findFirst({
      where: {
        action: MINISTRY_AUDIT_ACTIONS.SETTINGS_UPDATED,
        entityId: musicMinistryId,
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).toBeTruthy();
  });
});
