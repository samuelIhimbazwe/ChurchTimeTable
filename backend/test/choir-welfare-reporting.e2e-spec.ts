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

describe('Choir welfare reporting (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

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
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.CHOIR_PRESIDENT },
    });
    const permission = await prisma.permission.upsert({
      where: { code: PERMISSIONS.CHOIR_WELFARE_VIEW },
      create: { code: PERMISSIONS.CHOIR_WELFARE_VIEW, description: 'view' },
      update: {},
    });
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: role.id, permissionId: permission.id },
      },
      create: { roleId: role.id, permissionId: permission.id },
      update: {},
    });

    const email = `welfare-report-${Date.now()}@test.local`;
    await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash('TestPass1', 10),
        isActive: true,
        member: {
          create: {
            firstName: 'Report',
            lastName: 'Leader',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234700',
          },
        },
        userRoles: { create: { roleId: role.id } },
      },
    });

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPass1' });
    token = login.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns welfare reports summary', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/choir/welfare/reports')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.summary).toBeDefined();
    expect(Array.isArray(res.body.data.byCategory)).toBe(true);
  });
});
