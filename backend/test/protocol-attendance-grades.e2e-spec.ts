import request from 'supertest';
import { bootstrapProtocolE2e } from './helpers/protocol-e2e.helper';

describe('Protocol attendance grades (e2e)', () => {
  it('stores attendanceScoreEarned per outcome', async () => {
    const ctx = await bootstrapProtocolE2e();

    const team = await request(ctx.app.getHttpServer())
      .post('/api/v1/protocol/teams/generate')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        occurrenceId: ctx.occurrenceId,
        memberIds: [ctx.memberIds[0]],
      });

    await request(ctx.app.getHttpServer())
      .patch(`/api/v1/protocol/teams/${team.body.data.id}/status`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ status: 'REVIEWED' });

    const record = await request(ctx.app.getHttpServer())
      .post('/api/v1/protocol/attendance')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        teamMemberId: team.body.data.members[0].id,
        outcome: 'PRESENT_FULL',
      });

    expect(record.status).toBe(201);
    expect(record.body.data.attendanceScoreEarned).toBe(100);

    await ctx.app.close();
  });
});
