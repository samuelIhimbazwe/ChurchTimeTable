import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { closeE2eApp } from './helpers/e2e-app.util';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { MemberStatus } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { ROLES, PERMISSIONS } from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';
import { OPERATIONAL_UNIT_AUDIT_ACTIONS } from '../src/operational-units/operational-unit.constants';

describe('Operational Units MF-2 (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let memberAId: string;
  let memberBId: string;
  let mainChoirUnitId: string;
  let protocolTeamUnitId: string;
  let musicMinistryId: string;

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

    const music = await prisma.ministry.findUniqueOrThrow({ where: { code: 'MUSIC' } });
    musicMinistryId = music.id;
    await prisma.ministrySettings.upsert({
      where: { ministryId: musicMinistryId },
      create: { ministryId: musicMinistryId, allowOperationalUnits: true },
      update: { allowOperationalUnits: true },
    });

    const mainChoir = await prisma.operationalUnit.findFirstOrThrow({
      where: { ministryId: musicMinistryId, code: 'MAIN_CHOIR' },
    });
    mainChoirUnitId = mainChoir.id;

    const deacons = await prisma.ministry.findUniqueOrThrow({ where: { code: 'DEACONS' } });
    const protocolTeam = await prisma.operationalUnit.findFirstOrThrow({
      where: { ministryId: deacons.id, code: 'PROTOCOL_TEAM' },
    });
    protocolTeamUnitId = protocolTeam.id;

    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.SUPER_ADMIN },
    });
    const memberRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.MEMBER },
    });

    const passwordHash = await bcrypt.hash('TestPass1', 10);
    const ts = Date.now();

    await prisma.user.create({
      data: {
        email: `unit-admin-${ts}@test.local`,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Unit',
            lastName: 'Admin',
            ministry: 'BOTH',
            status: MemberStatus.ACTIVE,
            phone: `0790${String(ts).slice(-6)}`,
          },
        },
        userRoles: { create: { roleId: adminRole.id } },
      },
    });

    const memberUser = await prisma.user.create({
      data: {
        email: `unit-member-${ts}@test.local`,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Unit',
            lastName: 'MemberA',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: `0791${String(ts).slice(-6)}`,
          },
        },
        userRoles: { create: { roleId: memberRole.id } },
      },
      include: { member: true },
    });
    memberAId = memberUser.member!.id;

    const memberB = await prisma.member.create({
      data: {
        firstName: 'Unit',
        lastName: 'MemberB',
        ministry: 'CHOIR',
        status: MemberStatus.ACTIVE,
        phone: `0792${String(ts).slice(-6)}`,
        user: {
          create: {
            email: `unit-memberb-${ts}@test.local`,
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
      .send({ email: `unit-admin-${ts}@test.local`, password: 'TestPass1' });
    adminToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('lists seeded operational units', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/operational-units')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    expect(res.body.data.some((u: { code: string }) => u.code === 'MAIN_CHOIR')).toBe(true);
  });

  it('creates and updates a unit', async () => {
    const code = `OUTREACH_${Date.now()}`;
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/operational-units')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ministryId: musicMinistryId,
        code,
        name: `Outreach ${code}`,
        type: 'OUTREACH_TEAM',
      });
    expect(createRes.status).toBe(201);
    const unitId = createRes.body.data.id;

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/v1/operational-units/${unitId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'MF-2 outreach unit' });
    expect(patchRes.status).toBe(200);

    const audit = await app.get(PrismaService).auditLog.findFirst({
      where: { action: OPERATIONAL_UNIT_AUDIT_ACTIONS.CREATED, entityId: unitId },
    });
    expect(audit).toBeTruthy();
  });

  it('manages membership with soft removal', async () => {
    const addRes = await request(app.getHttpServer())
      .post(`/api/v1/operational-units/${mainChoirUnitId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberId: memberAId });
    expect(addRes.status).toBe(201);

    const removeRes = await request(app.getHttpServer())
      .delete(`/api/v1/operational-units/${mainChoirUnitId}/members/${memberAId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(removeRes.status).toBe(200);
    expect(removeRes.body.data.status).toBe('REMOVED');
  });

  it('assigns leadership and preserves history', async () => {
    const position = await app.get(PrismaService).operationalUnitLeadershipPosition.findFirstOrThrow({
      where: { operationalUnitId: mainChoirUnitId, name: 'Choir President' },
    });

    const assignRes = await request(app.getHttpServer())
      .post(`/api/v1/operational-units/${mainChoirUnitId}/leadership`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberId: memberBId, positionId: position.id });
    expect(assignRes.status).toBe(201);
    const assignmentId = assignRes.body.data.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/operational-units/${mainChoirUnitId}/leadership/${assignmentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    const leadership = await request(app.getHttpServer())
      .get(`/api/v1/operational-units/${mainChoirUnitId}/leadership`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(leadership.body.data.history.some((a: { id: string }) => a.id === assignmentId)).toBe(
      true,
    );
  });

  it('grants and revokes permissions', async () => {
    const grantRes = await request(app.getHttpServer())
      .post(`/api/v1/operational-units/${mainChoirUnitId}/permissions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberId: memberAId, permission: 'operational_unit.member.view' });
    expect(grantRes.status).toBe(201);
    const assignmentId = grantRes.body.data.id;

    const revokeRes = await request(app.getHttpServer())
      .delete(
        `/api/v1/operational-units/${mainChoirUnitId}/permissions/${assignmentId}`,
      )
      .set('Authorization', `Bearer ${adminToken}`);
    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.data.revokedAt).toBeTruthy();
  });

  it('returns summary', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/operational-units/${mainChoirUnitId}/summary`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.operationalUnitId).toBe(mainChoirUnitId);
    expect(res.body.data.type).toBe('CHOIR');
  });

  it('enforces cross-unit isolation', async () => {
    await app.get(PrismaService).operationalUnitMembership.create({
      data: {
        operationalUnitId: protocolTeamUnitId,
        memberId: memberAId,
        status: 'ACTIVE',
      },
    });

    await app.get(PrismaService).operationalUnitPermissionAssignment.create({
      data: {
        operationalUnitId: protocolTeamUnitId,
        memberId: memberAId,
        permission: 'operational_unit.member.view',
      },
    });

    const prisma = app.get(PrismaService);
    const memberUser = await prisma.member.findUniqueOrThrow({
      where: { id: memberAId },
      include: { user: true },
    });

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: memberUser.user.email, password: 'TestPass1' });
    const scopedToken = login.body.data.accessToken;

    const visible = await request(app.getHttpServer())
      .get('/api/v1/operational-units')
      .set('Authorization', `Bearer ${scopedToken}`);
    expect(visible.status).toBe(200);
    const ids = visible.body.data.map((u: { id: string }) => u.id);
    expect(ids).toContain(protocolTeamUnitId);
    expect(ids).not.toContain(mainChoirUnitId);
  });

  it('updates settings with audit', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/operational-units/${mainChoirUnitId}/settings`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ allowAttendance: false });
    expect(res.status).toBe(200);
    expect(res.body.data.allowAttendance).toBe(false);

    const audit = await app.get(PrismaService).auditLog.findFirst({
      where: {
        action: OPERATIONAL_UNIT_AUDIT_ACTIONS.SETTINGS_UPDATED,
        entityId: mainChoirUnitId,
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).toBeTruthy();
  });
});
