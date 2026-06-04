import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { bootstrapPilotE2eApp } from './pilot-ready-e2e.helper';

describe('Imports (e2e)', () => {
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

  it('previews and lists member CSV imports', async () => {
    const csv =
      'firstName,lastName,email,phone\nPilot,Import,pilot-import@test.local,0781111111\n';

    const preview = await request(app.getHttpServer())
      .post('/api/v1/imports')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('type', 'MEMBERS')
      .attach('file', Buffer.from(csv), 'members.csv');

    expect(preview.status).toBe(201);
    expect(preview.body.data.preview.summary.valid).toBeGreaterThanOrEqual(1);
    const jobId = preview.body.data.id as string;

    const list = await request(app.getHttpServer())
      .get('/api/v1/imports')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.some((j: { id: string }) => j.id === jobId)).toBe(true);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/imports/${jobId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.status).toBe('PREVIEWING');
  });
});
