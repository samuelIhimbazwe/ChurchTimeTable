import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { MemberStatus } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { ROLES } from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';

describe('User profile (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let memberToken: string;
  let memberUserId: string;

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

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@church.local', password: 'Admin@123' });
    adminToken = adminLogin.body.data.accessToken;

    const prisma = app.get(PrismaService);
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.MEMBER },
    });
    const email = `profile-${Date.now()}@test.local`;
    const passwordHash = await bcrypt.hash('TestPass1', 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Phone',
            lastName: 'Missing',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
          },
        },
        userRoles: { create: { roleId: role.id } },
      },
    });
    memberUserId = user.id;

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPass1' });
    memberToken = login.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('PATCH /users/me updates own profile', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        firstName: 'Updated',
        lastName: 'Member',
        phone: '0781234567',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.member.firstName).toBe('Updated');
    expect(res.body.data.member.phone).toBe('0781234567');
    expect(res.body.data.member.missingPhone).toBe(false);
  });

  it('PATCH /users/me rejects invalid phone', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ phone: 'invalid' })
      .expect(400);
  });

  it('PATCH /users/me rejects short names', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ firstName: 'A' })
      .expect(400);
  });

  it('PATCH /users/me only updates authenticated user', async () => {
    const meBefore = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ lastName: 'SelfOnly' })
      .expect(200);

    const adminAfter = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(adminAfter.body.data.member.lastName).toBe(
      meBefore.body.data.member.lastName,
    );
    expect(adminAfter.body.data.id).not.toBe(memberUserId);
  });

  it('GET /auth/me returns missingPhone for active member without phone', async () => {
    const prisma = app.get(PrismaService);
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.MEMBER },
    });
    const email = `missing-phone-${Date.now()}@test.local`;
    const passwordHash = await bcrypt.hash('TestPass1', 10);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'No',
            lastName: 'Phone',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
          },
        },
        userRoles: { create: { roleId: role.id } },
      },
    });

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPass1' });

    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .expect(200);

    expect(res.body.data.member.missingPhone).toBe(true);
    expect(res.body.data.member.phone).toBeNull();
  });
});
