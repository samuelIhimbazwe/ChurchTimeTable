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

export type OperationsE2eContext = {
  app: INestApplication<App>;
  prisma: PrismaService;
  adminToken: string;
  templateId: string;
  occurrenceId: string;
};

export async function bootstrapOperationsE2e(): Promise<OperationsE2eContext> {
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

  await prisma.user.create({
    data: {
      email: `mf7-admin-${ts}@test.local`,
      passwordHash,
      isActive: true,
      member: {
        create: {
          firstName: 'MF7',
          lastName: 'Admin',
          ministry: 'BOTH',
          status: MemberStatus.ACTIVE,
          phone: `0796${String(ts).slice(-6)}`,
        },
      },
      userRoles: { create: { roleId: adminRole.id } },
    },
  });

  const login = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: `mf7-admin-${ts}@test.local`, password: 'TestPass1' });

  const adminToken = login.body.data.accessToken;

  const template = await prisma.operationTemplate.findUniqueOrThrow({
    where: { code: 'TUESDAY_SERVICE' },
  });

  const start = new Date();
  start.setDate(start.getDate() + 14);
  const end = new Date(start);
  end.setHours(end.getHours() + 2);

  const createRes = await request(app.getHttpServer())
    .post('/api/v1/operations/occurrences')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      templateId: template.id,
      type: 'SERVICE',
      title: `Tuesday test ${ts}`,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    });

  const adminUser = await prisma.user.findFirstOrThrow({
    where: { email: `mf7-admin-${ts}@test.local` },
    include: { member: true },
  });
  const protocolUnit = await prisma.operationalUnit.findFirstOrThrow({
    where: { code: 'PROTOCOL_TEAM' },
  });
  const presidentPosition =
    await prisma.operationalUnitLeadershipPosition.findFirstOrThrow({
      where: { operationalUnitId: protocolUnit.id, name: 'President' },
    });
  await prisma.operationalUnitLeadershipAssignment.create({
    data: {
      operationalUnitId: protocolUnit.id,
      memberId: adminUser.member!.id,
      positionId: presidentPosition.id,
    },
  });

  return {
    app,
    prisma,
    adminToken,
    templateId: template.id,
    occurrenceId: createRes.body.data.id,
  };
}
