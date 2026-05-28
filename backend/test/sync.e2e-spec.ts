import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

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

  it('POST /sync/batch applies attendance', async () => {
    const eventRes = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Sync Test Event',
        type: 'CHOIR_SERVICE',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 90000000).toISOString(),
        ministryScope: 'CHOIR',
      });

    const eventId = eventRes.body.data.id;

    const res = await request(app.getHttpServer())
      .post('/api/v1/sync/batch')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          {
            entity: 'Attendance',
            entityId: `${eventId}_${memberId}`,
            clientUpdatedAt: new Date().toISOString(),
            payload: {
              eventId,
              memberId,
              physicalStatus: 'PRESENT',
            },
          },
        ],
      })
      .expect(201);

    expect(res.body.data.results[0].status).toBe('applied');
  });
});
