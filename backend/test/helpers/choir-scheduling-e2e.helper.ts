import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { MemberStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';
import { ROLES } from '../../src/common/constants/roles';
import { MAIN_CHOIR_ID } from '../../src/common/constants/choir.constants';
import { PrismaService } from '../../src/prisma/prisma.service';

export type ChoirSchedulingE2eContext = {
  app: INestApplication<App>;
  prisma: PrismaService;
  adminToken: string;
  choirId: string;
  memberIds: string[];
  occurrenceId: string;
};

export async function bootstrapChoirSchedulingE2e(): Promise<ChoirSchedulingE2eContext> {
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

  await prisma.choirEngineSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default' },
    update: {},
  });

  await prisma.choirServiceEligibility.upsert({
    where: { choirId: MAIN_CHOIR_ID },
    create: {
      choirId: MAIN_CHOIR_ID,
      eligibleForMainServices: true,
      eligibleForSunday1: true,
      eligibleForSunday2: true,
      eligibleForTuesday: true,
      eligibleForIgaburo: true,
      priority: 1,
    },
    update: {},
  });

  await prisma.user.create({
    data: {
      email: `choir2-admin-${ts}@test.local`,
      passwordHash,
      isActive: true,
      member: {
        create: {
          firstName: 'Choir',
          lastName: 'Admin',
          ministry: 'CHOIR',
          status: MemberStatus.ACTIVE,
          phone: `0796${String(ts).slice(-6)}`,
        },
      },
      userRoles: { create: { roleId: adminRole.id } },
    },
  });

  const login = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: `choir2-admin-${ts}@test.local`, password: 'TestPass1' });

  const adminToken = login.body.data.accessToken;
  const memberIds: string[] = [];

  for (let i = 0; i < 3; i += 1) {
    const user = await prisma.user.create({
      data: {
        email: `choir2-m${i}-${ts}@test.local`,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: `C${i}`,
            lastName: 'Singer',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: `0785${String(ts + i).slice(-6)}`,
          },
        },
      },
      include: { member: true },
    });
    memberIds.push(user.member!.id);
    await prisma.choirMembership.upsert({
      where: {
        userId_choirId: { userId: user.id, choirId: MAIN_CHOIR_ID },
      },
      create: { userId: user.id, choirId: MAIN_CHOIR_ID, role: 'MEMBER' },
      update: { isActive: true },
    });
  }

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
      title: `Choir2 test ${ts}`,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    });

  const occurrenceId = createRes.body.data.id as string;

  return {
    app,
    prisma,
    adminToken,
    choirId: MAIN_CHOIR_ID,
    memberIds,
    occurrenceId,
  };
}
