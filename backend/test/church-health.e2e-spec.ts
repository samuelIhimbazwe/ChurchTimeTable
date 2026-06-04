import request from 'supertest';
import {
  bootstrapChurchIntelligenceE2e,
  ChurchIntelligenceE2eContext,
} from './helpers/church-intelligence-e2e.helper';

describe('Church health MF-6 (e2e)', () => {
  let ctx: ChurchIntelligenceE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapChurchIntelligenceE2e();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('GET /church/intelligence/summary returns health metrics', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/church/intelligence/summary')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    expect(res.body.data).toMatchObject({
      ministryCount: expect.any(Number),
      activeMinistryCount: expect.any(Number),
      totalMembers: expect.any(Number),
    });
  });

  it('GET /church/intelligence/dashboard returns widget bundle', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/church/intelligence/dashboard')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    expect(res.body.data.summary).toBeDefined();
  });

  it('GET /church/intelligence/ministry-health returns scores', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/church/intelligence/ministry-health')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
