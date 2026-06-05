import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('CMMS API (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@church.local', password: 'Admin@123' });

    accessToken = login.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login returns token', () => {
    expect(accessToken).toBeDefined();
  });

  it('GET /auth/me returns profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('admin@church.local');
  });

  it('GET /system/stats returns platform counts', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/system/stats')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.members).toBeGreaterThanOrEqual(0);
    expect(res.body.data.operationOccurrences).toBeGreaterThanOrEqual(0);
  });

  it('GET /members/:id/scores/trends returns trend data', async () => {
    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    const memberId = me.body.data.member.id;

    const res = await request(app.getHttpServer())
      .get(`/api/v1/members/${memberId}/scores/trends`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.trends).toBeDefined();
  });
});
