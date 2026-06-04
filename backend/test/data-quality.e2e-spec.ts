import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { bootstrapPilotE2eApp } from './pilot-ready-e2e.helper';

describe('Data quality (e2e)', () => {
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

  it('exposes data quality metrics', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/system/data-quality')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('missingPhoneNumbers');
    expect(res.body.data).toHaveProperty('totals');
  });
});
