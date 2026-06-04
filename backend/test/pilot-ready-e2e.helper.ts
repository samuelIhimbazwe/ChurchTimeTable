import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { MemberStatus } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import {
  CHURCH_ADMIN_OPERATIONAL_PERMISSIONS,
  PERMISSIONS,
  ROLES,
} from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';

export async function bootstrapPilotE2eApp(): Promise<{
  app: INestApplication<App>;
  prisma: PrismaService;
  adminToken: string;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.init();

  const prisma = app.get(PrismaService);
  const stamp = Date.now();
  const passwordHash = await bcrypt.hash('TestPass1', 10);
  const email = `pilot-admin-${stamp}@test.local`;

  let role = await prisma.role.findUnique({ where: { name: ROLES.CHURCH_ADMIN } });
  if (!role) {
    role = await prisma.role.create({
      data: { name: ROLES.CHURCH_ADMIN, description: ROLES.CHURCH_ADMIN },
    });
  }

  const adminPerms = [
    ...new Set([
      ...CHURCH_ADMIN_OPERATIONAL_PERMISSIONS,
      PERMISSIONS.PILOT_IMPORT_MANAGE,
      PERMISSIONS.PILOT_READINESS_VIEW,
      PERMISSIONS.PILOT_BULK_MANAGE,
      PERMISSIONS.PILOT_EXPORT,
      PERMISSIONS.ADMIN_SETTINGS_MANAGE,
    ]),
  ];
  for (const code of adminPerms) {
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

  for (const code of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { code },
      create: { code, description: code },
      update: {},
    });
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      isActive: true,
      member: {
        create: {
          firstName: 'Pilot',
          lastName: 'Admin',
          ministry: 'BOTH',
          status: MemberStatus.ACTIVE,
          phone: `078${String(stamp).slice(-7)}`,
        },
      },
      userRoles: { create: { roleId: role.id } },
    },
  });

  const login = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password: 'TestPass1' });

  return {
    app,
    prisma,
    adminToken: login.body.data.accessToken as string,
  };
}
