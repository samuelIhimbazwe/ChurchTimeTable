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
import {
  PHONE_ENFORCEMENT_ENABLED_KEY,
  PHONE_ENFORCEMENT_MODE_KEY,
} from '../src/common/member/phone-enforcement.constants';

describe('Phone enforcement (e2e)', () => {
  let app: INestApplication<App>;
  let memberToken: string;
  let memberEmail: string;
  let prisma: PrismaService;

  async function enableStrictMode() {
    await prisma.systemSetting.upsert({
      where: { key: PHONE_ENFORCEMENT_ENABLED_KEY },
      create: { key: PHONE_ENFORCEMENT_ENABLED_KEY, value: true },
      update: { value: true },
    });
    await prisma.systemSetting.upsert({
      where: { key: PHONE_ENFORCEMENT_MODE_KEY },
      create: { key: PHONE_ENFORCEMENT_MODE_KEY, value: 'strict' },
      update: { value: 'strict' },
    });
  }

  async function disableStrictMode() {
    await prisma.systemSetting.upsert({
      where: { key: PHONE_ENFORCEMENT_ENABLED_KEY },
      create: { key: PHONE_ENFORCEMENT_ENABLED_KEY, value: false },
      update: { value: false },
    });
    await prisma.systemSetting.upsert({
      where: { key: PHONE_ENFORCEMENT_MODE_KEY },
      create: { key: PHONE_ENFORCEMENT_MODE_KEY, value: 'soft' },
      update: { value: 'soft' },
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
    await enableStrictMode();

    const role = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.CHOIR_SECRETARY },
    });

    for (const code of [PERMISSIONS.REPORT_EXPORT]) {
      const permission = await prisma.permission.upsert({
        where: { code },
        create: { code, description: code },
        update: {},
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        create: { roleId: role.id, permissionId: permission.id },
        update: {},
      });
    }

    memberEmail = `phone-enforce-${Date.now()}@test.local`;
    const passwordHash = await bcrypt.hash('TestPass1', 10);
    await prisma.user.create({
      data: {
        email: memberEmail,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Strict',
            lastName: 'Blocked',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
          },
        },
        userRoles: { create: { roleId: role.id } },
      },
    });

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: memberEmail, password: 'TestPass1' });
    memberToken = login.body.data.accessToken;
  });

  beforeEach(async () => {
    await enableStrictMode();
  });

  afterAll(async () => {
    await disableStrictMode();
    await app.close();
  });

  it('GET /auth/me returns phoneEnforcement state', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    expect(res.body.data.phoneEnforcement).toEqual({
      enabled: true,
      mode: 'strict',
      blocked: true,
    });
    expect(res.body.data.member.missingPhone).toBe(true);
  });

  it('strict mode blocks operational report export', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/reports/attendance')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);

    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('dashboard remains accessible in strict mode', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/dashboard/member-summary')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
  });

  it('profile route remains accessible in strict mode', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ phone: '0787654321' })
      .expect(200);
  });

  it('profile update restores operational access', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ phone: '0787654321' })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/reports/attendance')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    expect(me.body.data.phoneEnforcement.blocked).toBe(false);
    expect(me.body.data.member.missingPhone).toBe(false);
  });
});
