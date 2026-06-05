import request from 'supertest';
import { closeE2eApp } from './helpers/e2e-app.util';
import { bootstrapProtocolE2e } from './helpers/protocol-e2e.helper';

describe('Protocol team leaders (e2e)', () => {
  let ctx: Awaited<ReturnType<typeof bootstrapProtocolE2e>>;

  beforeAll(async () => {
    ctx = await bootstrapProtocolE2e();
  });

  afterAll(async () => {
    await closeE2eApp(ctx.app);
  });

  it('creates leader and assigns to team', async () => {

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
  });
});
