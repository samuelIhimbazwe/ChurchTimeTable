import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { bootstrapPilotE2eApp } from './pilot-ready-e2e.helper';

describe('Permission audit (e2e)', () => {
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

  it('returns a permission verification report', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/pilot/permission-audit')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.summary.rolesAudited).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.roles)).toBe(true);
  });
});
