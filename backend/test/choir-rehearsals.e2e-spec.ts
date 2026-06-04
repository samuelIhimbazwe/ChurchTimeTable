import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { EventType, MemberStatus, MinistryScope } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { ROLES, PERMISSIONS } from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Choir rehearsals (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let eventId: string;
  let songId: string;

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

    for (const code of [
      PERMISSIONS.CHOIR_REHEARSAL_VIEW,
      PERMISSIONS.CHOIR_REHEARSAL_MANAGE,
      PERMISSIONS.CHOIR_MUSIC_MANAGE,
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.EVENT_WRITE,
    ]) {
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

    const email = `rehearsal-leader-${Date.now()}@test.local`;
    const passwordHash = await bcrypt.hash('TestPass1', 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Rehearsal',
            lastName: 'Leader',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234610',
          },
        },
        userRoles: { create: { roleId: role.id } },
      },
      include: { member: true },
    });

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPass1' });
    token = login.body.data.accessToken;

    const song = await prisma.song.create({
      data: { title: 'Rehearsal Song', active: true },
    });
    songId = song.id;

    const event = await prisma.event.create({
      data: {
        title: 'Saturday Rehearsal',
        type: EventType.REHEARSAL,
        ministryScope: MinistryScope.CHOIR,
        startTime: new Date(Date.now() + 86400000),
        endTime: new Date(Date.now() + 90000000),
      },
    });
    eventId = event.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('upserts rehearsal plan and reads dashboard', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/choir/rehearsals/plans/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        objectives: 'Prepare Sunday set',
        songs: [{ songId, sortOrder: 0, estimatedMinutes: 15 }],
      })
      .expect(200);

    const plan = await request(app.getHttpServer())
      .get(`/api/v1/choir/rehearsals/plans/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(plan.body.data.songs.length).toBe(1);

    const dashboard = await request(app.getHttpServer())
      .get('/api/v1/choir/rehearsals/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(dashboard.body.data.upcomingRehearsals.length).toBeGreaterThan(0);
  });
});
