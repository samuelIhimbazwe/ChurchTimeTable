import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { ROLES } from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { MemberStatus } from '@prisma/client';

describe('Member privacy (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let readonlyToken: string;
  let rosterToken: string;

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

    const email = `readonly-${Date.now()}@privacy.test`;
    const register = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'TestPass1',
        firstName: 'Read',
        lastName: 'Only',
        ministry: 'CHOIR',
      });
    readonlyToken = register.body.data.accessToken;

    const prisma = app.get(PrismaService);
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.CHOIR_REHEARSAL_DIRECTOR },
    });
    const rosterEmail = `roster-${Date.now()}@privacy.test`;
    const passwordHash = await bcrypt.hash('TestPass1', 10);
    await prisma.user.create({
      data: {
        email: rosterEmail,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Roster',
            lastName: 'Picker',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
          },
        },
        userRoles: { create: { roleId: role.id } },
      },
    });
    const rosterLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: rosterEmail, password: 'TestPass1' });
    rosterToken = rosterLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('denies GET /members for event:read-only member', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/members')
      .set('Authorization', `Bearer ${readonlyToken}`)
      .expect(403);
  });

  it('denies GET /members/roster for event:read-only member', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/members/roster')
      .set('Authorization', `Bearer ${readonlyToken}`)
      .expect(403);
  });

  it('allows GET /members for member:manage admin', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.items?.length).toBeGreaterThan(0);
    expect(res.body.data.items[0].user?.email).toBeDefined();
  });

  it('allows GET /members/roster for assignment roles without member:manage', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/members')
      .set('Authorization', `Bearer ${rosterToken}`)
      .expect(403);

    const res = await request(app.getHttpServer())
      .get('/api/v1/members/roster')
      .set('Authorization', `Bearer ${rosterToken}`)
      .expect(200);

    expect(res.body.data.items?.length).toBeGreaterThan(0);
    const item = res.body.data.items[0];
    expect(item.email).toBeUndefined();
    expect(item.phone).toBeUndefined();
    expect(item.user).toBeUndefined();
  });

  it('returns roster without email or phone for admin', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/members/roster')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.items?.length).toBeGreaterThan(0);
    const item = res.body.data.items[0];
    expect(item.id).toBeDefined();
    expect(item.firstName).toBeDefined();
    expect(item.lastName).toBeDefined();
    expect(item.memberNumber === null || /^M\d{6}$/.test(item.memberNumber)).toBe(
      true,
    );
    expect(item.user).toBeUndefined();
    expect(item.email).toBeUndefined();
    expect(item.phone).toBeUndefined();
  });
});
