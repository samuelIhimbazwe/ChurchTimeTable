import request from 'supertest';
import {
  bootstrapChurchIntelligenceE2e,
  ChurchIntelligenceE2eContext,
} from './helpers/church-intelligence-e2e.helper';

describe('Governance alerts MF-6 (e2e)', () => {
  let ctx: ChurchIntelligenceE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapChurchIntelligenceE2e();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('GET /church/intelligence/alerts returns alert list', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/church/intelligence/alerts')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
