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

describe('Families (e2e)', () => {
  let app: INestApplication<App>;
  let leaderToken: string;
  let memberToken: string;
  let memberAId: string;
  let memberBId: string;
  let familyId: string;

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

    for (const code of familyPermissionCodes) {
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

    const leaderEmail = `family-leader-${Date.now()}@test.local`;
    const memberEmail = `family-member-${Date.now()}@test.local`;
    const passwordHash = await bcrypt.hash('TestPass1', 10);

    await prisma.user.create({
      data: {
        email: leaderEmail,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Family',
            lastName: 'Leader',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234567',
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
            firstName: 'Family',
            lastName: 'MemberA',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234568',
          },
        },
        userRoles: { create: { roleId: memberRole.id } },
      },
      include: { member: true },
    });
    memberAId = memberUser.member!.id;

    const memberB = await prisma.member.create({
      data: {
        firstName: 'Family',
        lastName: 'MemberB',
        ministry: 'CHOIR',
        status: MemberStatus.ACTIVE,
        phone: '0781234569',
        user: {
          create: {
            email: `family-member-b-${Date.now()}@test.local`,
            passwordHash,
            isActive: true,
            userRoles: { create: { roleId: memberRole.id } },
          },
        },
      },
    });
    memberBId = memberB.id;

    const leaderLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: leaderEmail, password: 'TestPass1' });
    leaderToken = leaderLogin.body.data.accessToken;

    const memberLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: memberEmail, password: 'TestPass1' });
    memberToken = memberLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('leader can create a family', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/families')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ familyName: 'Nkurunziza Family' })
      .expect(201);

    familyId = res.body.data.id;
    expect(res.body.data.familyCode).toMatch(/^FAM\d{6}$/);
    expect(res.body.data.familyName).toBe('Nkurunziza Family');
  });

  it('leader can add a member to the family', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/members`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ memberId: memberAId, role: 'HEAD' })
      .expect(201);

    expect(res.body.data.members).toHaveLength(1);
    expect(res.body.data.headMember?.id).toBe(memberAId);
  });

  it('prevents duplicate family membership', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/members`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ memberId: memberAId })
      .expect(400);
  });

  it('member without family permission cannot list families', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/families')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });

  it('leader can list families in scope', async () => {
    const detail = await request(app.getHttpServer())
      .get(`/api/v1/families/${familyId}`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .expect(200);

    expect(detail.body.data.id).toBe(familyId);
    expect(detail.body.data.members.length).toBeGreaterThan(0);

    const res = await request(app.getHttpServer())
      .get('/api/v1/families')
      .set('Authorization', `Bearer ${leaderToken}`)
      .expect(200);

    expect(res.body.data.meta.total).toBeGreaterThan(0);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  it('leader can add second member and remove them', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/members`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ memberId: memberBId, role: 'MEMBER' })
      .expect(201);

    const detail = await request(app.getHttpServer())
      .delete(`/api/v1/families/${familyId}/members/${memberBId}`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .expect(200);

    expect(detail.body.data.members).toHaveLength(1);
  });
});
