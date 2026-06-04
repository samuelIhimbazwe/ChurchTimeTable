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

export type ChurchIntelligenceE2eContext = {
  app: INestApplication<App>;
  prisma: PrismaService;
  adminToken: string;
  musicMinistryId: string;
};

export async function bootstrapChurchIntelligenceE2e(): Promise<ChurchIntelligenceE2eContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.init();

  const prisma = app.get(PrismaService);
  const music = await prisma.ministry.findUniqueOrThrow({
    where: { code: 'MUSIC' },
  });

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: ROLES.SUPER_ADMIN },
  });
  const passwordHash = await bcrypt.hash('TestPass1', 10);
  const ts = Date.now();

  await prisma.user.create({
    data: {
      email: `mf6-admin-${ts}@test.local`,
      passwordHash,
      isActive: true,
      member: {
        create: {
          firstName: 'MF6',
          lastName: 'Admin',
          ministry: 'BOTH',
          status: MemberStatus.ACTIVE,
          phone: `0795${String(ts).slice(-6)}`,
        },
      },
      userRoles: { create: { roleId: adminRole.id } },
    },
  });

  const login = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: `mf6-admin-${ts}@test.local`, password: 'TestPass1' });

  return {
    app,
    prisma,
    adminToken: login.body.data.accessToken,
    musicMinistryId: music.id,
  };
}
