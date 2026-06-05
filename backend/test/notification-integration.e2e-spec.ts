import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { bootstrapPilotE2eApp } from './pilot-ready-e2e.helper';
import { closeE2eApp } from './helpers/e2e-app.util';

describe('Notification integration (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;

  beforeAll(async () => {
    const boot = await bootstrapPilotE2eApp();
    app = boot.app;
    adminToken = boot.adminToken;
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('lists notification rules including choir assignment', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/pilot/notification-rules')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const triggers = res.body.data.map((r: { trigger: string }) => r.trigger);
    expect(triggers).toContain('CHOIR_ASSIGNMENT');
    expect(triggers).toContain('SCHEDULE_CHANGE');
  });
});
