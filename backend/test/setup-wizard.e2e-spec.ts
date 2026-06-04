import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { bootstrapPilotE2eApp } from './pilot-ready-e2e.helper';

describe('Setup wizard (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;

  beforeAll(async () => {
    const boot = await bootstrapPilotE2eApp();
    app = boot.app;
    adminToken = boot.adminToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns wizard steps and saves church info', async () => {
    const initial = await request(app.getHttpServer())
      .get('/api/v1/setup')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(initial.status).toBe(200);
    expect(initial.body.data.totalSteps).toBe(7);

    const step1 = await request(app.getHttpServer())
      .post('/api/v1/setup')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        step: 1,
        data: { name: 'Test Church', location: 'Kigali', language: 'rw' },
      });
    expect([200, 201]).toContain(step1.status);

    const status = await request(app.getHttpServer())
      .get('/api/v1/setup/status')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(status.status).toBe(200);
    expect(status.body.data.level).toBeDefined();
  });
});
