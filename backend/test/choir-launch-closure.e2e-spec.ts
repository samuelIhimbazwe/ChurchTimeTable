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
import { deleteE2eSong } from './helpers/e2e-music-cleanup';

describe('Choir launch closure (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let memberId: string;
  let categoryId: string;
  let caseId: string;
  let songId: string;
  let eventId: string;

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
    const presidentRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.CHOIR_PRESIDENT },
    });

    const perms = [
      PERMISSIONS.CHOIR_WELFARE_VIEW,
      PERMISSIONS.CHOIR_WELFARE_MANAGE,
      PERMISSIONS.CHOIR_MUSIC_VIEW,
      PERMISSIONS.CHOIR_MUSIC_MANAGE,
      PERMISSIONS.CHOIR_REHEARSAL_VIEW,
      PERMISSIONS.CHOIR_REHEARSAL_MANAGE,
      PERMISSIONS.CHOIR_MEETING_MANAGE,
      PERMISSIONS.CHOIR_DOCUMENT_MANAGE,
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.EVENT_WRITE,
    ];

    for (const code of perms) {
      const permission = await prisma.permission.upsert({
        where: { code },
        create: { code, description: code },
        update: {},
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: presidentRole.id,
            permissionId: permission.id,
          },
        },
        create: { roleId: presidentRole.id, permissionId: permission.id },
        update: {},
      });
    }

    const email = `choir-launch-${Date.now()}@test.local`;
    const passwordHash = await bcrypt.hash('TestPass1', 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Launch',
            lastName: 'President',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234599',
          },
        },
        userRoles: { create: { roleId: presidentRole.id } },
      },
      include: { member: true },
    });
    memberId = user.member!.id;

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPass1' });
    token = login.body.data.accessToken;

    const category = await prisma.welfareCategory.findFirst({
      where: { active: true },
    });
    categoryId =
      category?.id ??
      (
        await prisma.welfareCategory.create({
          data: { code: `LC${Date.now()}`, name: 'Launch Cat', active: true },
        })
      ).id;

    const song = await prisma.song.create({
      data: {
        title: '[e2e] Turagusingiza',
        language: 'rw',
        active: true,
      },
    });
    songId = song.id;

    const event = await prisma.event.create({
      data: {
        title: `Launch Rehearsal ${Date.now()}`,
        type: 'REHEARSAL',
        startTime: new Date(Date.now() + 86400000),
        endTime: new Date(Date.now() + 90000000),
        ministryScope: 'CHOIR',
        status: 'SCHEDULED',
      },
    });
    eventId = event.id;
  });

  afterAll(async () => {
    const prisma = app.get(PrismaService);
    if (songId) await deleteE2eSong(prisma, songId);
    if (eventId) {
      await prisma.rehearsalPlan.deleteMany({ where: { choirActivityId: eventId } }).catch(() => {});
      await prisma.event.delete({ where: { id: eventId } }).catch(() => {});
    }
    await app.close();
  });

  it('search includes choir extensions', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/search')
      .query({ q: 'Launch' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data).toHaveProperty('welfareCategories');
    expect(res.body.data).toHaveProperty('meetingDecisions');
    expect(res.body.data).toHaveProperty('songCategories');
    expect(res.body.data).toHaveProperty('welfareAssistance');
  });

  it('welfare case lifecycle', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/choir/welfare/cases')
      .set('Authorization', `Bearer ${token}`)
      .send({
        memberId,
        categoryId,
        title: 'Launch welfare case',
        description: 'E2E launch closure welfare',
        requestedAmount: 1000,
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });
    caseId = created.body.data.id;

    await request(app.getHttpServer())
      .get(`/api/v1/choir/welfare/cases/${caseId}/timeline`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/choir/welfare/assistance')
      .set('Authorization', `Bearer ${token}`)
      .send({
        caseId,
        assistanceType: 'CASH',
        description: 'Launch assistance grant',
        amount: 50,
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });
  });

  it('music favorites and analytics', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/choir/music/songs/${songId}/favorite`)
      .set('Authorization', `Bearer ${token}`)
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const fav = await request(app.getHttpServer())
      .get('/api/v1/choir/music/favorites')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(fav.body.data)).toBe(true);

    await request(app.getHttpServer())
      .get('/api/v1/choir/music/analytics')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('rehearsal readiness reports and attendance', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/choir/rehearsals/readiness')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/choir/rehearsals/reports')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/choir/rehearsals/plans/${eventId}/attendance`)
      .set('Authorization', `Bearer ${token}`)
      .send({ entries: [{ memberId, status: 'PRESENT' }] })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });
  });
});
