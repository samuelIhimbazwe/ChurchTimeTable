import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { DevotionType, MemberStatus } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { ROLES, PERMISSIONS } from '../src/common/constants/roles';
import { MAIN_CHOIR_ID } from '../src/common/constants/choir.constants';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Multi-choir + devotions (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let mainPresidentToken: string;
  let youthPresidentToken: string;
  let dualMemberToken: string;
  let youthChoirId: string;

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

    prisma = app.get(PrismaService);

    const presidentRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.CHOIR_PRESIDENT },
    });
    const memberRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.MEMBER },
    });

    for (const code of [
      PERMISSIONS.CHOIR_DEVOTION_VIEW,
      PERMISSIONS.CHOIR_DEVOTION_CREATE,
      PERMISSIONS.CHOIR_DEVOTION_PUBLISH,
      PERMISSIONS.CHOIR_DEVOTION_MANAGE,
      PERMISSIONS.CHOIR_WELFARE_VIEW,
      PERMISSIONS.CHOIR_WELFARE_MANAGE,
    ]) {
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
      if (code === PERMISSIONS.CHOIR_DEVOTION_VIEW) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: memberRole.id,
              permissionId: permission.id,
            },
          },
          create: { roleId: memberRole.id, permissionId: permission.id },
          update: {},
        });
      }
    }

    const youthChoir = await prisma.choir.create({
      data: {
        code: `YOUTH_${Date.now()}`,
        name: 'Youth Choir',
        description: 'E2E youth choir',
      },
    });
    youthChoirId = youthChoir.id;

    const passwordHash = await bcrypt.hash('TestPass1', 10);
    const ts = Date.now();

    const mainPresident = await prisma.user.create({
      data: {
        email: `main-pres-${ts}@test.local`,
        passwordHash,
        member: {
          create: {
            firstName: 'Main',
            lastName: 'President',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781111001',
          },
        },
        userRoles: { create: { roleId: presidentRole.id } },
        choirMemberships: {
          create: {
            choirId: MAIN_CHOIR_ID,
            role: ROLES.CHOIR_PRESIDENT,
          },
        },
      },
    });

    const youthPresident = await prisma.user.create({
      data: {
        email: `youth-pres-${ts}@test.local`,
        passwordHash,
        member: {
          create: {
            firstName: 'Youth',
            lastName: 'President',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781111002',
          },
        },
        userRoles: { create: { roleId: presidentRole.id } },
        choirMemberships: {
          create: {
            choirId: youthChoirId,
            role: ROLES.CHOIR_PRESIDENT,
          },
        },
      },
    });

    const dualMember = await prisma.user.create({
      data: {
        email: `dual-${ts}@test.local`,
        passwordHash,
        member: {
          create: {
            firstName: 'Dual',
            lastName: 'Member',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781111003',
          },
        },
        userRoles: { create: { roleId: memberRole.id } },
        choirMemberships: {
          createMany: {
            data: [
              { choirId: MAIN_CHOIR_ID, role: ROLES.MEMBER },
              { choirId: youthChoirId, role: ROLES.MEMBER },
            ],
          },
        },
      },
    });

    const login = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'TestPass1' })
        .expect(201);
      return res.body.data.accessToken as string;
    };

    mainPresidentToken = await login(mainPresident.email);
    youthPresidentToken = await login(youthPresident.email);
    dualMemberToken = await login(dualMember.email);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists user choirs and switches context', async () => {
    const choirs = await request(app.getHttpServer())
      .get('/api/v1/choirs')
      .set('Authorization', `Bearer ${dualMemberToken}`)
      .expect(200);
    expect(choirs.body.data.length).toBeGreaterThanOrEqual(2);

    await request(app.getHttpServer())
      .post('/api/v1/choirs/switch')
      .set('Authorization', `Bearer ${dualMemberToken}`)
      .send({ choirId: youthChoirId })
      .expect(201);
  });

  it('isolates devotions per choir', async () => {
    const mainDraft = await request(app.getHttpServer())
      .post('/api/v1/choir/devotions')
      .set('Authorization', `Bearer ${mainPresidentToken}`)
      .set('x-choir-id', MAIN_CHOIR_ID)
      .send({
        title: 'Main encouragement',
        content: 'Stay faithful',
        type: DevotionType.ENCOURAGEMENT,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/choir/devotions/${mainDraft.body.data.id}/publish`)
      .set('Authorization', `Bearer ${mainPresidentToken}`)
      .set('x-choir-id', MAIN_CHOIR_ID)
      .expect(201);

    const youthDraft = await request(app.getHttpServer())
      .post('/api/v1/choir/devotions')
      .set('Authorization', `Bearer ${youthPresidentToken}`)
      .set('x-choir-id', youthChoirId)
      .send({
        title: 'Youth verse',
        content: 'John 3:16',
        type: DevotionType.VERSE_OF_DAY,
        verseReference: 'John 3:16',
        verseText: 'For God so loved the world...',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/choir/devotions/${youthDraft.body.data.id}/publish`)
      .set('Authorization', `Bearer ${youthPresidentToken}`)
      .set('x-choir-id', youthChoirId)
      .expect(201);

    const mainWidget = await request(app.getHttpServer())
      .get('/api/v1/choir/devotions/widget')
      .set('Authorization', `Bearer ${dualMemberToken}`)
      .set('x-choir-id', MAIN_CHOIR_ID)
      .expect(200);

    expect(mainWidget.body.data.encouragement?.title).toBe('Main encouragement');
    expect(mainWidget.body.data.verseOfDay?.title).not.toBe('Youth verse');

    const youthWidget = await request(app.getHttpServer())
      .get('/api/v1/choir/devotions/widget')
      .set('Authorization', `Bearer ${dualMemberToken}`)
      .set('x-choir-id', youthChoirId)
      .expect(200);

    expect(youthWidget.body.data.verseOfDay?.title).toBe('Youth verse');
    expect(youthWidget.body.data.encouragement?.title).not.toBe('Main encouragement');
  });

  it('enforces one pinned devotion per choir', async () => {
    const pinA = await request(app.getHttpServer())
      .post('/api/v1/choir/devotions')
      .set('Authorization', `Bearer ${mainPresidentToken}`)
      .set('x-choir-id', MAIN_CHOIR_ID)
      .send({
        title: 'Pinned A',
        content: 'Prayer focus',
        type: DevotionType.ANNOUNCEMENT,
        isPinned: true,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/choir/devotions/${pinA.body.data.id}/publish`)
      .set('Authorization', `Bearer ${mainPresidentToken}`)
      .set('x-choir-id', MAIN_CHOIR_ID)
      .expect(201);

    const pinB = await request(app.getHttpServer())
      .post('/api/v1/choir/devotions')
      .set('Authorization', `Bearer ${mainPresidentToken}`)
      .set('x-choir-id', MAIN_CHOIR_ID)
      .send({
        title: 'Pinned B',
        content: 'New announcement',
        type: DevotionType.ANNOUNCEMENT,
        isPinned: true,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/choir/devotions/${pinB.body.data.id}/publish`)
      .set('Authorization', `Bearer ${mainPresidentToken}`)
      .set('x-choir-id', MAIN_CHOIR_ID)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/choir/devotions/${pinB.body.data.id}/pin`)
      .set('Authorization', `Bearer ${mainPresidentToken}`)
      .set('x-choir-id', MAIN_CHOIR_ID)
      .expect(201);

    const widget = await request(app.getHttpServer())
      .get('/api/v1/choir/devotions/widget')
      .set('Authorization', `Bearer ${mainPresidentToken}`)
      .set('x-choir-id', MAIN_CHOIR_ID)
      .expect(200);

    expect(widget.body.data.pinned?.title).toBe('Pinned B');

    const unpinnedA = await prisma.devotion.findUnique({
      where: { id: pinA.body.data.id },
    });
    expect(unpinnedA?.isPinned).toBe(false);
  });
});
