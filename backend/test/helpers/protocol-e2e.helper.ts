import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { MemberStatus, MinistryMembershipStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';
import { ROLES } from '../../src/common/constants/roles';
import { PrismaService } from '../../src/prisma/prisma.service';

export type ProtocolE2eContext = {
  app: INestApplication<App>;
  prisma: PrismaService;
  adminToken: string;
  protocolUnitId: string;
  memberIds: string[];
  occurrenceId: string;
};

export async function bootstrapProtocolE2e(): Promise<ProtocolE2eContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.init();

  const prisma = app.get(PrismaService);
  await prisma.protocolEngineSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default' },
    update: {},
  });

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: ROLES.SUPER_ADMIN },
  });
  const passwordHash = await bcrypt.hash('TestPass1', 10);
  const ts = Date.now();

  await prisma.user.create({
    data: {
      email: `protocol-admin-${ts}@test.local`,
      passwordHash,
      isActive: true,
      member: {
        create: {
          firstName: 'Protocol',
          lastName: 'Admin',
          ministry: 'PROTOCOL',
          status: MemberStatus.ACTIVE,
          phone: `0797${String(ts).slice(-6)}`,
        },
      },
      userRoles: { create: { roleId: adminRole.id } },
    },
  });

  const login = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: `protocol-admin-${ts}@test.local`, password: 'TestPass1' });

  const adminToken = login.body.data.accessToken;

  const protocolUnit = await prisma.operationalUnit.findFirstOrThrow({
    where: { code: 'PROTOCOL_TEAM' },
  });

  const memberIds: string[] = [];
  for (let i = 0; i < 4; i += 1) {
    const user = await prisma.user.create({
      data: {
        email: `protocol-m${i}-${ts}@test.local`,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: `P${i}`,
            lastName: 'Member',
            ministry: 'PROTOCOL',
            status: MemberStatus.ACTIVE,
            phone: `0788${String(ts + i).slice(-6)}`,
          },
        },
      },
      include: { member: true },
    });
    memberIds.push(user.member!.id);
    await prisma.operationalUnitMembership.create({
      data: {
        operationalUnitId: protocolUnit.id,
        memberId: user.member!.id,
        status: MinistryMembershipStatus.ACTIVE,
      },
    });
  }

  const template = await prisma.operationTemplate.findUniqueOrThrow({
    where: { code: 'TUESDAY_SERVICE' },
  });

  const start = new Date();
  start.setDate(start.getDate() + 10);
  const end = new Date(start);
  end.setHours(end.getHours() + 2);

  const createRes = await request(app.getHttpServer())
    .post('/api/v1/operations/occurrences')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      templateId: template.id,
      type: 'SERVICE',
      title: `Protocol test ${ts}`,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    });

  const occurrenceId = createRes.body.data.id as string;

  await request(app.getHttpServer())
    .post(`/api/v1/operations/occurrences/${occurrenceId}/assignments`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ assignmentType: 'PROTOCOL_TEAM' });

  return {
    app,
    prisma,
    adminToken,
    protocolUnitId: protocolUnit.id,
    memberIds,
    occurrenceId,
  };
}
