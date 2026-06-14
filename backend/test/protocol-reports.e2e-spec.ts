import request from 'supertest';
import { closeE2eApp } from './helpers/e2e-app.util';
import { bootstrapProtocolE2e } from './helpers/protocol-e2e.helper';

describe('Protocol reports (e2e)', () => {
  it('returns monthly service report', async () => {
    const ctx = await bootstrapProtocolE2e();
    const now = new Date();

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/protocol/reports/monthly-service')
      .query({ year: now.getFullYear(), month: now.getMonth() + 1 })
      .set('Authorization', `Bearer ${ctx.adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('teams');

    const health = await request(ctx.app.getHttpServer())
      .get('/api/v1/protocol/reports/health')
      .set('Authorization', `Bearer ${ctx.adminToken}`);

    expect(health.status).toBe(200);
    expect(typeof health.body.data.score).toBe('number');
    expect(health.body.data.grade).toBeDefined();

    await closeE2eApp(ctx.app);
  });
});
