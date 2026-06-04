import request from 'supertest';
import {
  bootstrapChoirSchedulingE2e,
  ChoirSchedulingE2eContext,
} from './helpers/choir-scheduling-e2e.helper';

describe('Choir rankings (CHOIR-2)', () => {
  let ctx: ChoirSchedulingE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapChoirSchedulingE2e();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('generates category rankings', async () => {
    const year = new Date().getFullYear();
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/choir/scheduling/rankings/generate')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ choirId: ctx.choirId, year, month: 6 });
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
