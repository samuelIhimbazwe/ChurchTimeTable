import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { randomUUID } from 'crypto';

describe('Sync API (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let memberId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@church.local', password: 'Admin@123' });
    token = login.body.data.accessToken;

    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    memberId = me.body.data.member.id;
  });

  afterAll(() => app.close());

  it('POST /sync/batch applies discipline case', async () => {
    const entityId = randomUUID();
    const res = await request(app.getHttpServer())
      .post('/api/v1/sync/batch')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          {
            entity: 'DisciplineCase',
            entityId,
            clientUpdatedAt: new Date().toISOString(),
            payload: {
              memberId,
              ministry: 'CHOIR',
              title: 'Sync test case',
              description: 'Created via sync batch e2e',
            },
          },
        ],
      })
      .expect(201);

    expect(res.body.data.results[0].status).toBe('applied');
  });

  it('POST /sync/batch rejects legacy attendance entity', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/sync/batch')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          {
            entity: 'Attendance',
            entityId: randomUUID(),
            clientUpdatedAt: new Date().toISOString(),
            payload: {
              eventId: randomUUID(),
              memberId,
              physicalStatus: 'PRESENT',
            },
          },
        ],
      })
      .expect(201);

    expect(res.body.data.results[0].status).toBe('rejected');
  });
});
