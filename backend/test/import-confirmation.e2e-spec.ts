import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { bootstrapPilotE2eApp } from './pilot-ready-e2e.helper';

describe('Import confirmation (e2e)', () => {
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

  it('cancels a preview job and exposes results endpoint', async () => {
    const stamp = Date.now();
    const csv = `firstName,lastName,email\nCancel,Test,cancel-${stamp}@test.local\n`;

    const preview = await request(app.getHttpServer())
      .post('/api/v1/imports')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('type', 'MEMBERS')
      .attach('file', Buffer.from(csv), 'cancel.csv');
    expect(preview.status).toBe(201);
    const jobId = preview.body.data.id as string;

    const cancelled = await request(app.getHttpServer())
      .post(`/api/v1/imports/${jobId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cancelled.status).toBe(201);
    expect(cancelled.body.data.status).toBe('CANCELLED');

    const results = await request(app.getHttpServer())
      .get(`/api/v1/imports/${jobId}/results`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(results.status).toBe(200);
    expect(results.body.data.status).toBe('CANCELLED');
  });
});
