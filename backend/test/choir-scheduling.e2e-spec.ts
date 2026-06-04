import request from 'supertest';
import {
  bootstrapChoirSchedulingE2e,
  ChoirSchedulingE2eContext,
} from './helpers/choir-scheduling-e2e.helper';

describe('Choir scheduling (CHOIR-2)', () => {
  let ctx: ChoirSchedulingE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapChoirSchedulingE2e();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('recommends and assigns choirs for a service', async () => {
    const rec = await request(ctx.app.getHttpServer())
      .get(`/api/v1/choir/scheduling/occurrences/${ctx.occurrenceId}/recommendations`)
      .set('Authorization', `Bearer ${ctx.adminToken}`);
    expect(rec.status).toBe(200);

    const assign = await request(ctx.app.getHttpServer())
      .post('/api/v1/choir/scheduling/assignments')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        choirId: ctx.choirId,
        occurrenceId: ctx.occurrenceId,
        role: 'PRIMARY',
      });
    expect(assign.status).toBe(201);
    expect(assign.body.data.choirId).toBe(ctx.choirId);
  });

  it('generates a monthly schedule plan', async () => {
    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/choir/scheduling/plans/generate')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        label: 'Test June',
        periodType: 'MONTHLY',
        year: start.getFullYear(),
        month: start.getMonth() + 1,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });
    expect(res.status).toBe(201);
    expect(res.body.data.label).toBe('Test June');
  });
});
