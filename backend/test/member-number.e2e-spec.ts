import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';
import { buildRegisterPayload } from './helpers/register-payload.helper';

describe('Member number (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;

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

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@church.local', password: 'Admin@123' });
    adminToken = login.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('registration generates memberNumber', async () => {
    const email = `member-number-${Date.now()}@test.local`;
    const register = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(buildRegisterPayload({ email, firstName: 'Seq', lastName: 'Member' }))
      .expect(201);

    const token = register.body.data.accessToken;
    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(me.body.data.member.memberNumber).toMatch(/^M\d{6}$/);
  });

  it('/members/roster includes memberNumber without email or phone', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/members/roster')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const item = res.body.data.items[0];
    expect(item).toHaveProperty('memberNumber');
    expect(item.email).toBeUndefined();
    expect(item.phone).toBeUndefined();
  });

  it('registrations receive unique memberNumbers', async () => {
    const numbers = new Set<string>();

    for (let i = 0; i < 2; i += 1) {
      const email = `unique-${Date.now()}-${i}@test.local`;
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(buildRegisterPayload({ email, firstName: 'Unique', lastName: `User${i}` }))
        .expect(201);

      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'TestPass1' });

      const me = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${login.body.data.accessToken}`);

      numbers.add(me.body.data.member.memberNumber);
    }

    expect(numbers.size).toBe(2);
  });

  it('sync payload cannot overwrite memberNumber', async () => {
    const email = `sync-protect-${Date.now()}@test.local`;
    const register = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(buildRegisterPayload({ email, firstName: 'Sync', lastName: 'Protect' }))
      .expect(201);

    const token = register.body.data.accessToken;
    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const memberId = me.body.data.member.id;
    const originalNumber = me.body.data.member.memberNumber;
    const prisma = app.get(PrismaService);

    await request(app.getHttpServer())
      .post('/api/v1/sync/batch')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          {
            entity: 'Member',
            entityId: memberId,
            clientUpdatedAt: new Date().toISOString(),
            payload: {
              firstName: 'StillSync',
              memberNumber: 'M999999',
            },
          },
        ],
      })
      .expect(201);

    const after = await prisma.member.findUnique({
      where: { id: memberId },
      select: { memberNumber: true, firstName: true },
    });

    expect(after?.memberNumber).toBe(originalNumber);
    expect(after?.firstName).toBe('StillSync');
  });
});
