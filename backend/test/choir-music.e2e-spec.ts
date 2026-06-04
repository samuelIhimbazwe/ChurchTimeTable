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

describe('Choir music (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
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

    for (const code of [PERMISSIONS.CHOIR_MUSIC_VIEW, PERMISSIONS.CHOIR_MUSIC_MANAGE]) {
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

    const email = `music-leader-${Date.now()}@test.local`;
    const passwordHash = await bcrypt.hash('TestPass1', 10);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Music',
            lastName: 'Leader',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234600',
          },
        },
        userRoles: { create: { roleId: role.id } },
      },
    });

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPass1' });
    token = login.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates and reads a song', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/choir/music/songs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Amazing Grace',
        composer: 'Traditional',
        language: 'en',
        lyricsText: 'Amazing grace',
      })
      .expect(201);

    songId = created.body.data.id;

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/choir/music/songs/${songId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(detail.body.data.title).toBe('Amazing Grace');
  });

  it('toggles favorite and lists analytics', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/choir/music/songs/${songId}/favorite`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const favorites = await request(app.getHttpServer())
      .get('/api/v1/choir/music/favorites')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(favorites.body.data.length).toBeGreaterThan(0);

    const analytics = await request(app.getHttpServer())
      .get('/api/v1/choir/music/analytics')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(analytics.body.data.totalSongs).toBeGreaterThan(0);
  });
});
