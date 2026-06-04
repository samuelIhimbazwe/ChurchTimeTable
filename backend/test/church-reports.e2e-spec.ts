import request from 'supertest';
import {
  bootstrapChurchIntelligenceE2e,
  ChurchIntelligenceE2eContext,
} from './helpers/church-intelligence-e2e.helper';

describe('Church reports MF-6 (e2e)', () => {
  let ctx: ChurchIntelligenceE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapChurchIntelligenceE2e();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('GET /church/intelligence/reports lists report catalog', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/church/intelligence/reports')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /church/intelligence/reports/growth-summary returns data', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/church/intelligence/reports/growth-summary')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    expect(res.body.data.summary).toBeDefined();
  });
});
