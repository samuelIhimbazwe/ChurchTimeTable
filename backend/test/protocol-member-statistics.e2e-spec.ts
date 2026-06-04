import request from 'supertest';
import { bootstrapProtocolE2e } from './helpers/protocol-e2e.helper';

describe('Protocol member statistics (e2e)', () => {
  it('exposes my-statistics and my-ranking for member', async () => {
    const ctx = await bootstrapProtocolE2e();

    const stats = await request(ctx.app.getHttpServer())
      .get('/api/v1/protocol/my-statistics')
      .set('Authorization', `Bearer ${ctx.adminToken}`);

    expect(stats.status).toBe(200);
    expect(stats.body.data).toHaveProperty('memberId');

    const ranking = await request(ctx.app.getHttpServer())
      .get('/api/v1/protocol/my-ranking')
      .set('Authorization', `Bearer ${ctx.adminToken}`);

    expect(ranking.status).toBe(200);
    expect(ranking.body.data).toHaveProperty('categories');

    await ctx.app.close();
  });
});
