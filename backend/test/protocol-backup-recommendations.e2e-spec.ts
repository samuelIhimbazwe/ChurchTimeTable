import request from 'supertest';
import { bootstrapProtocolE2e } from './helpers/protocol-e2e.helper';

describe('Protocol backup recommendations (e2e)', () => {
  it('generates backup pool for team', async () => {
    const ctx = await bootstrapProtocolE2e();

    const team = await request(ctx.app.getHttpServer())
      .post('/api/v1/protocol/teams/generate')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        occurrenceId: ctx.occurrenceId,
        memberIds: [ctx.memberIds[0]],
      });

    const backups = await request(ctx.app.getHttpServer())
      .get('/api/v1/protocol/backups')
      .query({ teamId: team.body.data.id })
      .set('Authorization', `Bearer ${ctx.adminToken}`);

    expect(backups.status).toBe(200);
    expect(Array.isArray(backups.body.data)).toBe(true);

    await ctx.app.close();
  });
});
