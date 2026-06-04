import request from 'supertest';
import { bootstrapProtocolE2e } from './helpers/protocol-e2e.helper';

describe('Protocol team leaders (e2e)', () => {
  it('creates leader and assigns to team', async () => {
    const ctx = await bootstrapProtocolE2e();

    const leader = await request(ctx.app.getHttpServer())
      .post('/api/v1/protocol/team-leaders')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        memberId: ctx.memberIds[0],
        isNonChoirLeader: true,
        label: 'Non-Choir Leader',
      });

    expect(leader.status).toBe(201);

    const team = await request(ctx.app.getHttpServer())
      .post('/api/v1/protocol/teams/generate')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        occurrenceId: ctx.occurrenceId,
        memberIds: ctx.memberIds.slice(0, 2),
      });

    expect(team.status).toBe(201);
    expect(team.body.data.teamLeader).toBeTruthy();

    await ctx.app.close();
  });
});
