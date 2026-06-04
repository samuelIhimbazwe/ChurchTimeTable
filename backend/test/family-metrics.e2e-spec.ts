import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import {
  AttendanceOperationalStatus,
  ContributionStatus,
  ContributionType,
  EventType,
  MemberStatus,
  PhysicalStatus,
} from '@prisma/client';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { ROLES, PERMISSIONS } from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Family metrics (e2e)', () => {
  let app: INestApplication<App>;
  let leaderToken: string;
  let memberToken: string;
  let memberAId: string;
  let familyId: string;
  let eventId: string;

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
    const memberRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.MEMBER },
    });
    const presidentRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.CHOIR_PRESIDENT },
    });

    const familyPermissionCodes = [
      PERMISSIONS.FAMILY_VIEW,
      PERMISSIONS.FAMILY_MANAGE,
    ];
    await prisma.rolePermission.deleteMany({
      where: {
        roleId: memberRole.id,
        permission: { code: { in: familyPermissionCodes } },
      },
    });

    for (const code of [
      PERMISSIONS.FAMILY_VIEW,
      PERMISSIONS.FAMILY_MANAGE,
      PERMISSIONS.CHOIR_FINANCE_VIEW,
      PERMISSIONS.CHOIR_FINANCE_MANAGE,
    ]) {
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

    const leaderEmail = `metrics-leader-${Date.now()}@test.local`;
    const memberEmail = `metrics-member-${Date.now()}@test.local`;
    const passwordHash = await bcrypt.hash('TestPass1', 10);

    await prisma.user.create({
      data: {
        email: leaderEmail,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Metrics',
            lastName: 'Leader',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234570',
          },
        },
        userRoles: { create: { roleId: presidentRole.id } },
      },
    });

    const memberUser = await prisma.user.create({
      data: {
        email: memberEmail,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Metrics',
            lastName: 'Member',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234571',
          },
        },
        userRoles: { create: { roleId: memberRole.id } },
      },
      include: { member: true },
    });
    memberAId = memberUser.member!.id;

    const event = await prisma.event.create({
      data: {
        title: 'Metrics Service',
        type: EventType.CHOIR_SERVICE,
        ministryScope: 'CHOIR',
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 3600000),
      },
    });
    eventId = event.id;

    await prisma.attendance.create({
      data: {
        eventId,
        memberId: memberAId,
        physicalStatus: PhysicalStatus.PRESENT,
        operationalStatus: AttendanceOperationalStatus.ATTENDED,
      },
    });

    await prisma.contributionRecord.create({
      data: {
        memberId: memberAId,
        contributionType: ContributionType.OTHER,
        amount: 1500,
        status: ContributionStatus.CONFIRMED,
        referenceNumber: `MET-${Date.now()}`,
      },
    });

    const leaderLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: leaderEmail, password: 'TestPass1' });
    leaderToken = leaderLogin.body.data.accessToken;

    const memberLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: memberEmail, password: 'TestPass1' });
    memberToken = memberLogin.body.data.accessToken;

    const familyRes = await request(app.getHttpServer())
      .post('/api/v1/families')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ familyName: 'Metrics Family' })
      .expect(201);
    familyId = familyRes.body.data.id;

    await request(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/members`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ memberId: memberAId, role: 'HEAD' })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('member without family permission cannot read metrics', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/metrics`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });

  it('leader can read family metrics with aggregated values', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/metrics`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .expect(200);

    expect(res.body.data.familyId).toBe(familyId);
    expect(res.body.data.attendance.attendanceCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.contributions.confirmedAmount).toBeGreaterThanOrEqual(1500);
    expect(res.body.data.health.score).toBeGreaterThan(0);
    expect(res.body.data.health.grade).toMatch(/^[A-F]$/);
  });

  it('leader can read metrics overview for scoped families', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/families/metrics/overview')
      .set('Authorization', `Bearer ${leaderToken}`)
      .expect(200);

    expect(res.body.data.totalFamilies).toBeGreaterThan(0);
    expect(typeof res.body.data.averageHealthScore).toBe('number');
    expect(Array.isArray(res.body.data.topFamilies)).toBe(true);
    expect(Array.isArray(res.body.data.needsAttention)).toBe(true);
  });

  it('list endpoint can include health score metrics', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/families?includeMetrics=true&familyId=${familyId}`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .expect(200);

    const family = res.body.data.items.find(
      (item: { id: string }) => item.id === familyId,
    );
    expect(family).toBeDefined();
    expect(typeof family.healthScore).toBe('number');
    expect(family.healthGrade).toMatch(/^[A-F]$/);
  });
});
