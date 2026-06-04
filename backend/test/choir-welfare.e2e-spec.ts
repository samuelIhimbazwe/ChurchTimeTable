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

describe('Choir welfare (e2e)', () => {
  let app: INestApplication<App>;
  let leaderToken: string;
  let memberToken: string;
  let memberId: string;
  let categoryId: string;
  let caseId: string;

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

    for (const code of [PERMISSIONS.CHOIR_WELFARE_VIEW, PERMISSIONS.CHOIR_WELFARE_MANAGE]) {
      const permission = await prisma.permission.upsert({
        where: { code },
        create: { code, description: code },
        update: {},
      });
      for (const roleId of [presidentRole.id, memberRole.id]) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId,
              permissionId: permission.id,
            },
          },
          create: { roleId, permissionId: permission.id },
          update: {},
        });
      }
    }

    const leaderEmail = `welfare-leader-${Date.now()}@test.local`;
    const memberEmail = `welfare-member-${Date.now()}@test.local`;
    const passwordHash = await bcrypt.hash('TestPass1', 10);

    const memberUser = await prisma.user.create({
      data: {
        email: memberEmail,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Welfare',
            lastName: 'Member',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234590',
          },
        },
        userRoles: { create: { roleId: memberRole.id } },
      },
      include: { member: true },
    });
    memberId = memberUser.member!.id;

    await prisma.user.create({
      data: {
        email: leaderEmail,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Welfare',
            lastName: 'Leader',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234591',
          },
        },
        userRoles: { create: { roleId: presidentRole.id } },
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

    const categories = await request(app.getHttpServer())
      .get('/api/v1/choir/welfare/categories')
      .set('Authorization', `Bearer ${leaderToken}`)
      .expect(200);
    categoryId = categories.body.data[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('leader creates a welfare case', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/choir/welfare/cases')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        memberId,
        categoryId,
        title: 'Medical support',
        description: 'Hospital bills for choir member',
        requestedAmount: 50000,
      })
      .expect(201);

    caseId = res.body.data.id;
    expect(res.body.data.status).toBe('OPEN');
  });

  it('member can submit a welfare contribution', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/choir/welfare/my-contributions')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ caseId, amount: 5000, isAnonymous: true })
      .expect(201);
  });

  it('leader reads case timeline and dashboard', async () => {
    const timeline = await request(app.getHttpServer())
      .get(`/api/v1/choir/welfare/cases/${caseId}/timeline`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .expect(200);

    expect(timeline.body.data.length).toBeGreaterThan(0);

    const dashboard = await request(app.getHttpServer())
      .get('/api/v1/choir/welfare/dashboard')
      .set('Authorization', `Bearer ${leaderToken}`)
      .expect(200);

    expect(dashboard.body.data.openCases).toBeGreaterThan(0);
    expect(dashboard.body.data.fundsRaised).toBeGreaterThan(0);
  });
});
