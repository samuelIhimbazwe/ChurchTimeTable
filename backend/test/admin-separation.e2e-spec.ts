import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { MemberStatus } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import {
  CHURCH_ADMIN_ACCOUNT_PERMISSIONS,
  PERMISSIONS,
  ROLES,
} from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Admin permission separation (e2e)', () => {
  let app: INestApplication<App>;
  let churchAdminToken: string;
  let superAdminToken: string;

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

    let churchAdminRole = await prisma.role.findUnique({
      where: { name: ROLES.CHURCH_ADMIN },
    });
    if (!churchAdminRole) {
      churchAdminRole = await prisma.role.create({
        data: { name: ROLES.CHURCH_ADMIN, description: 'Church operations admin' },
      });
    }

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

    const superAdminRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.SUPER_ADMIN },
    });
    for (const code of Object.values(PERMISSIONS)) {
      const permission = await prisma.permission.upsert({
        where: { code },
        create: { code, description: code },
        update: {},
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        },
        create: { roleId: superAdminRole.id, permissionId: permission.id },
        update: {},
      });
    }

    const passwordHash = await bcrypt.hash('TestPass1', 10);
    const churchEmail = `church-admin-${Date.now()}@test.local`;

    await prisma.user.create({
      data: {
        email: churchEmail,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Church',
            lastName: 'Admin',
            ministry: 'BOTH',
            status: MemberStatus.ACTIVE,
            phone: '0781234590',
          },
        },
        userRoles: { create: { roleId: churchAdminRole.id } },
      },
    });

    const churchLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: churchEmail, password: 'TestPass1' });
    churchAdminToken = churchLogin.body.data.accessToken;

    const superLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@church.local', password: 'Admin@123' });
    superAdminToken = superLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('CHURCH_ADMIN is denied platform audit and system settings', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/audit')
      .set('Authorization', `Bearer ${churchAdminToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/system/stats')
      .set('Authorization', `Bearer ${churchAdminToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/dashboard/admin-summary')
      .set('Authorization', `Bearer ${churchAdminToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/attendance/scoring/weights')
      .set('Authorization', `Bearer ${churchAdminToken}`)
      .expect(403);
  });

  it('CHURCH_ADMIN retains account administration access only', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/members')
      .set('Authorization', `Bearer ${churchAdminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/families')
      .set('Authorization', `Bearer ${churchAdminToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/events')
      .set('Authorization', `Bearer ${churchAdminToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/finance/stewardship/analytics')
      .set('Authorization', `Bearer ${churchAdminToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/governance/choir/default-choir')
      .set('Authorization', `Bearer ${churchAdminToken}`)
      .expect(403);
  });

  it('SUPER_ADMIN retains platform administration access', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/audit')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/system/stats')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/dashboard/admin-summary')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);
  });
});
