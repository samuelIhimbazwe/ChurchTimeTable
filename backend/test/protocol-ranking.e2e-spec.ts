import request from 'supertest';
import { closeE2eApp } from './helpers/e2e-app.util';
import { bootstrapProtocolE2e } from './helpers/protocol-e2e.helper';

describe('Protocol ranking (e2e)', () => {
  it('generates monthly rankings', async () => {
    const ctx = await bootstrapProtocolE2e();
    const now = new Date();

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/protocol/rankings/generate')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ year: now.getFullYear(), month: now.getMonth() + 1 });

    expect(res.status).toBe(201);
    expect(Array.isArray(res.body.data)).toBe(true);

    await closeE2eApp(ctx.app);
  });
});
