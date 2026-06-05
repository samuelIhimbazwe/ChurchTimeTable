import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { MemberStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';
import {
  CHOIR_OPERATIONS_PERMS,
  PERMISSIONS,
  PROTOCOL_ADMIN_PERMISSIONS,
  ROLES,
} from '../../src/common/constants/roles';
import { PrismaService } from '../../src/prisma/prisma.service';

export type UxFinalE2eContext = {
  app: INestApplication<App>;
  prisma: PrismaService;
  choirPresidentToken: string;
  protocolCoordinatorToken: string;
  memberToken: string;
  elimChoirId: string;
};

async function ensureRolePermissions(
  prisma: PrismaService,
  roleName: string,
  permissions: string[],
) {
  let role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    role = await prisma.role.create({
      data: { name: roleName, description: roleName },
    });
  }
  for (const code of [...new Set(permissions)]) {
    const permission = await prisma.permission.upsert({
      where: { code },
      create: { code, description: code },
      update: {},
    });
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: role.id, permissionId: permission.id },
      },
      create: { roleId: role.id, permissionId: permission.id },
      update: {},
    });
  }
  return role;
}

export async function bootstrapUxFinalE2e(): Promise<UxFinalE2eContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.init();

  const prisma = app.get(PrismaService);
  const ts = Date.now();
  const passwordHash = await bcrypt.hash('TestPass1', 10);

  for (const code of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { code },
      create: { code, description: code },
      update: {},
    });
  }

  const elim = await prisma.choir.upsert({
    where: { code: 'ELIM' },
    create: {
      code: 'ELIM',
      name: 'Elim',
      choirKind: 'PRIMARY',
      isPublicJoinable: true,
      isActive: true,
    },
    update: { isPublicJoinable: true, isActive: true },
  });

  const presidentRole = await ensureRolePermissions(
    prisma,
    ROLES.CHOIR_PRESIDENT,
    [...CHOIR_OPERATIONS_PERMS],
  );

  const protocolRole = await ensureRolePermissions(prisma, ROLES.PROTOCOL_LEADER, [
    ...PROTOCOL_ADMIN_PERMISSIONS,
    PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,
    PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,
  ]);

  const presidentEmail = `ux-president-${ts}@test.local`;
  const protocolEmail = `ux-protocol-${ts}@test.local`;
  const memberEmail = `ux-member-${ts}@test.local`;

  await prisma.user.create({
    data: {
      email: presidentEmail,
      passwordHash,
      isActive: true,
      member: {
        create: {
          firstName: 'Choir',
          lastName: 'President',
          ministry: 'CHOIR',
          status: MemberStatus.ACTIVE,
          phone: `0781${String(ts).slice(-6)}`,
        },
      },
      userRoles: { create: { roleId: presidentRole.id } },
    },
  });

  await prisma.user.create({
    data: {
      email: protocolEmail,
      passwordHash,
      isActive: true,
      member: {
        create: {
          firstName: 'Protocol',
          lastName: 'Coordinator',
          ministry: 'PROTOCOL',
          status: MemberStatus.ACTIVE,
          phone: `0782${String(ts).slice(-6)}`,
        },
      },
      userRoles: { create: { roleId: protocolRole.id } },
    },
  });

  await prisma.user.create({
    data: {
      email: memberEmail,
      passwordHash,
      isActive: true,
      member: {
        create: {
          firstName: 'Church',
          lastName: 'Member',
          ministry: 'BOTH',
          status: MemberStatus.ACTIVE,
          phone: `0783${String(ts).slice(-6)}`,
        },
      },
    },
  });

  const server = app.getHttpServer();
  const presidentLogin = await request(server)
    .post('/api/v1/auth/login')
    .send({ email: presidentEmail, password: 'TestPass1' });
  const protocolLogin = await request(server)
    .post('/api/v1/auth/login')
    .send({ email: protocolEmail, password: 'TestPass1' });
  const memberLogin = await request(server)
    .post('/api/v1/auth/login')
    .send({ email: memberEmail, password: 'TestPass1' });

  return {
    app,
    prisma,
    choirPresidentToken: presidentLogin.body.data.accessToken,
    protocolCoordinatorToken: protocolLogin.body.data.accessToken,
    memberToken: memberLogin.body.data.accessToken,
    elimChoirId: elim.id,
  };
}
