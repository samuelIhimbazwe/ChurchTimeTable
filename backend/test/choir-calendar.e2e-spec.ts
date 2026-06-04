import request from 'supertest';
import {
  bootstrapChoirSchedulingE2e,
  ChoirSchedulingE2eContext,
} from './helpers/choir-scheduling-e2e.helper';

describe('Choir calendar (CHOIR-2)', () => {
  let ctx: ChoirSchedulingE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapChoirSchedulingE2e();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('lists choir calendar items and MF-7 merged calendar', async () => {
    const from = new Date();
    const to = new Date(from);
    to.setMonth(to.getMonth() + 2);

    const choirCal = await request(ctx.app.getHttpServer())
      .get(
        `/api/v1/choir/scheduling/calendar?from=${from.toISOString()}&to=${to.toISOString()}&choirId=${ctx.choirId}`,
      )
      .set('Authorization', `Bearer ${ctx.adminToken}`);
    expect(choirCal.status).toBe(200);

    const opsCal = await request(ctx.app.getHttpServer())
      .get(
        `/api/v1/operations/calendar?from=${from.toISOString()}&to=${to.toISOString()}`,
      )
      .set('Authorization', `Bearer ${ctx.adminToken}`);
    expect(opsCal.status).toBe(200);
    expect(opsCal.body.data).toHaveProperty('choirActivities');
  });
});
