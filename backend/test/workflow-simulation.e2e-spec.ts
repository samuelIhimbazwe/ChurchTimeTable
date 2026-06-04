import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { bootstrapPilotE2eApp } from './pilot-ready-e2e.helper';

describe('Workflow simulation (e2e)', () => {
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

  it('runs workflow simulation scenarios', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/pilot/simulations/run')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(201);
    expect(res.body.data.steps.length).toBeGreaterThan(0);
    expect(res.body.data.summary).toHaveProperty('passed');
  });
});
