import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { bootstrapPilotE2eApp } from './pilot-ready-e2e.helper';

describe('Notification rules (e2e)', () => {
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

  it('lists and toggles notification rules', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/pilot/notification-rules')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThan(0);

    const trigger = list.body.data[0].trigger as string;
    const patch = await request(app.getHttpServer())
      .patch(`/api/v1/pilot/notification-rules/${trigger}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ enabled: false });
    expect(patch.status).toBe(200);
    expect(patch.body.data.enabled).toBe(false);
  });
});
