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

describe('Member profile (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let presidentToken: string;
  let memberToken: string;
  let memberId: string;
  let outsiderToken: string;

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
      PERMISSIONS.MEMBER_MANAGE,
      PERMISSIONS.MEMBER_READ,
      PERMISSIONS.EVENT_READ,
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
    }

    const passwordHash = await bcrypt.hash('TestPass1', 10);
    const stamp = Date.now();

    const createUser = async (
      email: string,
      roleId: string,
      firstName: string,
    ) => {
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          isActive: true,
          member: {
            create: {
              firstName,
              lastName: 'ProfileTest',
              ministry: 'CHOIR',
              status: MemberStatus.ACTIVE,
              phone: '0781234567',
            },
          },
          userRoles: { create: { roleId } },
        },
      });
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'TestPass1' });
      return login.body.data as { accessToken: string };
    };

    const president = await createUser(
      `president-profile-${stamp}@test.local`,
      presidentRole.id,
      'President',
    );
    presidentToken = president.accessToken;

    const member = await createUser(
      `member-profile-${stamp}@test.local`,
      memberRole.id,
      'Member',
    );
    memberToken = member.accessToken;

    const memberUser = await prisma.user.findUniqueOrThrow({
      where: { email: `member-profile-${stamp}@test.local` },
      include: { member: true },
    });
    memberId = memberUser.member!.id;

    const outsider = await createUser(
      `outsider-profile-${stamp}@test.local`,
      memberRole.id,
      'Outsider',
    );
    outsiderToken = outsider.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows member to read own profile center', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/members/${memberId}/profile`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    expect(res.body.data.member.id).toBe(memberId);
    expect(res.body.data.capabilities.canEditProfile).toBe(true);
    expect(res.body.data.capabilities.canViewAttendanceDetail).toBe(true);
  });

  it('allows president to read member profile and timeline', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/members/${memberId}/profile`)
      .set('Authorization', `Bearer ${presidentToken}`)
      .expect(200);

    const timeline = await request(app.getHttpServer())
      .get(`/api/v1/members/${memberId}/timeline`)
      .set('Authorization', `Bearer ${presidentToken}`)
      .expect(200);

    expect(Array.isArray(timeline.body.data.events)).toBe(true);
  });

  it('returns 404 for unrelated member profile access', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/members/${memberId}/profile`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(404);
  });

  it('allows member to patch own extended profile', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/members/${memberId}/profile`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        voicePart: 'TENOR',
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '0788000000',
      })
      .expect(200);

    expect(res.body.data.voicePart).toBe('TENOR');
    expect(res.body.data.emergencyContactName).toBe('Jane Doe');
  });

  it('allows president to change member status with history', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/members/${memberId}/status`)
      .set('Authorization', `Bearer ${presidentToken}`)
      .send({ status: 'PROBATION', reason: 'Pilot review period' })
      .expect(200);

    const history = await request(app.getHttpServer())
      .get(`/api/v1/members/${memberId}/status-history`)
      .set('Authorization', `Bearer ${presidentToken}`)
      .expect(200);

    expect(history.body.data.length).toBeGreaterThan(0);
    expect(history.body.data[0].toStatus).toBe('PROBATION');
  });
});
