import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { bootstrapPilotE2eApp } from './pilot-ready-e2e.helper';

describe('GO-LIVE-READY-1 (e2e)', () => {
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

  it('returns go-live report with extended indicators', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/deployment/go-live-report')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.readinessScore).toBeDefined();
    const keys = (res.body.data.indicators as Array<{ key: string }>).map(
      (i) => i.key,
    );
    expect(keys).toContain('importUiReady');
    expect(keys).toContain('reminderJobsActive');
    expect(keys).toContain('notificationLogsActive');
    expect(keys).toContain('e2ePassing');
  });

  it('exposes reminders dashboard', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/reminders/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.enabledRules).toBeDefined();
    expect(res.body.data.executions).toBeDefined();
  });

  it('runs reminder jobs on demand', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/reminders/run-now')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(201);
    expect(res.body.data.ok).toBe(true);
  });

  it('lists delivery logs endpoint', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/reminders/delivery-logs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
