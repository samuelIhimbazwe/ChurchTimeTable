import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { MemberStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';
import { ROLES } from '../../src/common/constants/roles';
import { PrismaService } from '../../src/prisma/prisma.service';

export type MemberPortalE2eContext = {
  app: INestApplication<App>;
  prisma: PrismaService;
  memberToken: string;
  adminToken: string;
  memberId: string;
  userId: string;
  elimChoirId: string;
  integuzaChoirId: string;
  yerusalemuChoirId: string;
};

export async function bootstrapMemberPortalE2e(): Promise<MemberPortalE2eContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.init();

  const prisma = app.get(PrismaService);
  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: ROLES.SUPER_ADMIN },
  });
  const passwordHash = await bcrypt.hash('TestPass1', 10);
  const ts = Date.now();

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
  const integuza = await prisma.choir.upsert({
    where: { code: 'INTEGUZA' },
    create: {
      code: 'INTEGUZA',
      name: 'Integuza',
      choirKind: 'PRIMARY',
      isPublicJoinable: true,
      isActive: true,
    },
    update: { isPublicJoinable: true, isActive: true },
  });
  const yerusalemu = await prisma.choir.upsert({
    where: { code: 'YERUSALEMU' },
    create: {
      code: 'YERUSALEMU',
      name: 'Yerusalemu',
      choirKind: 'SPECIAL',
      isPublicJoinable: true,
      isActive: true,
    },
    update: { isPublicJoinable: true, isActive: true },
  });

  const memberUser = await prisma.user.create({
    data: {
      email: `portal-m-${ts}@test.local`,
      passwordHash,
      isActive: true,
      member: {
        create: {
          firstName: 'Portal',
          lastName: 'Member',
          ministry: 'CHOIR',
          status: MemberStatus.ACTIVE,
          phone: `0795${String(ts).slice(-6)}`,
        },
      },
    },
    include: { member: true },
  });

  await prisma.user.create({
    data: {
      email: `portal-admin-${ts}@test.local`,
      passwordHash,
      isActive: true,
      member: {
        create: {
          firstName: 'Portal',
          lastName: 'Admin',
          ministry: 'CHOIR',
          status: MemberStatus.ACTIVE,
          phone: `0794${String(ts).slice(-6)}`,
        },
      },
      userRoles: { create: { roleId: adminRole.id } },
    },
  });

  const memberLogin = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: `portal-m-${ts}@test.local`, password: 'TestPass1' });
  const adminLogin = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: `portal-admin-${ts}@test.local`, password: 'TestPass1' });

  return {
    app,
    prisma,
    memberToken: memberLogin.body.data.accessToken,
    adminToken: adminLogin.body.data.accessToken,
    memberId: memberUser.member!.id,
    userId: memberUser.id,
    elimChoirId: elim.id,
    integuzaChoirId: integuza.id,
    yerusalemuChoirId: yerusalemu.id,
  };
}
