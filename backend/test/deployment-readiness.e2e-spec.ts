import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { bootstrapPilotE2eApp } from './pilot-ready-e2e.helper';

describe('Deployment readiness (e2e)', () => {
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

  it('returns readiness level and indicators', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/setup/readiness')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.readinessScore).toBeGreaterThanOrEqual(0);
    expect(['NOT_READY', 'PARTIAL', 'READY', 'PILOT_READY', 'LIVE_READY']).toContain(
      res.body.data.level,
    );
    expect(res.body.data.indicators.length).toBeGreaterThan(0);
  });
});
