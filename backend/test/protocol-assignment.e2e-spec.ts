import request from 'supertest';
import { bootstrapProtocolE2e } from './helpers/protocol-e2e.helper';

describe('Protocol assignment (e2e)', () => {
  it('generates recommendations and team for occurrence', async () => {
    const ctx = await bootstrapProtocolE2e();

    const rec = await request(ctx.app.getHttpServer())
      .get(`/api/v1/protocol/occurrences/${ctx.occurrenceId}/recommendations`)
      .set('Authorization', `Bearer ${ctx.adminToken}`);

    expect(rec.status).toBe(200);
    expect(rec.body.data.length).toBeGreaterThan(0);

    const team = await request(ctx.app.getHttpServer())
      .post('/api/v1/protocol/teams/generate')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        occurrenceId: ctx.occurrenceId,
        memberIds: ctx.memberIds.slice(0, 3),
      });

    expect(team.status).toBe(201);
    expect(team.body.data.members.length).toBe(3);

    await ctx.app.close();
  });
});
