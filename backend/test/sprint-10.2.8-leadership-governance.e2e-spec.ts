import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { FamilyMemberRole, MemberStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { PERMISSIONS, ROLES } from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Sprint 10.2.8 — leadership governance (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let familyId: string;
  let adminToken: string;
  let memberId: string;

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

    const role = await prisma.role.upsert({
      where: { name: ROLES.MEMBER },
      create: { name: ROLES.MEMBER, description: ROLES.MEMBER },
      update: {},
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const code of [PERMISSIONS.FAMILY_VIEW, PERMISSIONS.FAMILY_MANAGE]) {
      const p = await prisma.permission.upsert({
        where: { code },
        create: { code, description: code },
        update: {},
      });
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: p.id },
      });
    }

    familyId = (
      await prisma.family.create({
        data: {
          familyCode: `FAM108${Date.now()}`,
          familyName: 'Leadership Gov',
          delegationEnabled: false,
        },
      })
    ).id;

    const email = `s108-admin-${Date.now()}@test.local`;
    const admin = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash('TestPass1', 10),
        isActive: true,
        member: {
          create: {
            firstName: 'Admin',
            lastName: 'Lead',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234567',
          },
        },
        userRoles: { create: { roleId: role.id } },
      },
      include: { member: true },
    });
    adminToken = await jwtService.signAsync({ sub: admin.id, email });

    const memberEmail = `s108-mem-${Date.now()}@test.local`;
    const member = await prisma.user.create({
      data: {
        email: memberEmail,
        passwordHash: await bcrypt.hash('TestPass1', 10),
        isActive: true,
        member: {
          create: {
            firstName: 'Path',
            lastName: 'Member',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234568',
          },
        },
      },
      include: { member: true },
    });
    memberId = member.member!.id;

    await prisma.familyMember.create({
      data: { familyId, memberId, role: FamilyMemberRole.MEMBER },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('role transition MEMBER → SECRETARY → ASSISTANT_HEAD closes and opens tenure', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/families/${familyId}/members/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: FamilyMemberRole.SECRETARY, reason: 'Elected secretary' })
      .expect(200);

    let history = await prisma.familyLeadershipHistory.findMany({
      where: { familyId, memberId },
      orderBy: { startedAt: 'asc' },
    });
    expect(history.some((h) => h.role === FamilyMemberRole.SECRETARY && !h.endedAt)).toBe(
      true,
    );

    const assigned = await prisma.auditLog.findFirst({
      where: { action: 'FAMILY_LEADERSHIP_ASSIGNED', entity: 'FamilyLeadershipHistory' },
      orderBy: { createdAt: 'desc' },
    });
    expect(assigned).toBeTruthy();

    await request(app.getHttpServer())
      .patch(`/api/v1/families/${familyId}/members/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: FamilyMemberRole.ASSISTANT_HEAD, reason: 'Promoted to assistant' })
      .expect(200);

    history = await prisma.familyLeadershipHistory.findMany({
      where: { familyId, memberId },
      orderBy: { startedAt: 'asc' },
    });
    const secretaryEnded = history.find(
      (h) => h.role === FamilyMemberRole.SECRETARY && h.endedAt,
    );
    expect(secretaryEnded).toBeTruthy();
    expect(
      history.some(
        (h) => h.role === FamilyMemberRole.ASSISTANT_HEAD && !h.endedAt,
      ),
    ).toBe(true);

    const ended = await prisma.auditLog.findFirst({
      where: { action: 'FAMILY_LEADERSHIP_ENDED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(ended).toBeTruthy();
  });

  it('delegation toggle audits FAMILY_DELEGATION_TOGGLE', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/families/${familyId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ delegationEnabled: true })
      .expect(200);

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'FAMILY_DELEGATION_TOGGLE', entityId: familyId },
    });
    expect(audit).toBeTruthy();
  });

  it('GET leadership-history returns tenure rows', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/leadership-history`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.familyId).toBe(familyId);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });
});
