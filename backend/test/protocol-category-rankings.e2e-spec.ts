import request from 'supertest';
import { bootstrapProtocolE2e } from './helpers/protocol-e2e.helper';

describe('Protocol category rankings (e2e)', () => {
  it('generates multi-category rankings', async () => {
    const ctx = await bootstrapProtocolE2e();
    const now = new Date();

    await request(ctx.app.getHttpServer())
      .post('/api/v1/protocol/rankings/generate')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ year: now.getFullYear(), month: now.getMonth() + 1 });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/protocol/rankings/categories')
      .query({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        category: 'ATTENDANCE',
      })
      .set('Authorization', `Bearer ${ctx.adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    await ctx.app.close();
  });
});
