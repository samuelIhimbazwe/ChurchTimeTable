import request from 'supertest';
import {
  bootstrapChoirSchedulingE2e,
  ChoirSchedulingE2eContext,
} from './helpers/choir-scheduling-e2e.helper';

describe('Choir participation (CHOIR-2)', () => {
  let ctx: ChoirSchedulingE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapChoirSchedulingE2e();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('returns leader and member dashboards', async () => {
    const leader = await request(ctx.app.getHttpServer())
      .get(`/api/v1/choir/scheduling/dashboard?choirId=${ctx.choirId}`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .set('x-choir-id', ctx.choirId);
    expect(leader.status).toBe(200);
    expect(leader.body.data).toHaveProperty('upcomingServices');

    const report = await request(ctx.app.getHttpServer())
      .get(`/api/v1/choir/scheduling/reports/participation?choirId=${ctx.choirId}`)
      .set('Authorization', `Bearer ${ctx.adminToken}`);
    expect(report.status).toBe(200);
  });
});
