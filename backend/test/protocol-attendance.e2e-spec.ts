import request from 'supertest';
import { bootstrapProtocolE2e } from './helpers/protocol-e2e.helper';

describe('Protocol attendance (e2e)', () => {
  it('records attendance and updates stats only when present', async () => {
    const ctx = await bootstrapProtocolE2e();

    const team = await request(ctx.app.getHttpServer())
      .post('/api/v1/protocol/teams/generate')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        occurrenceId: ctx.occurrenceId,
        memberIds: [ctx.memberIds[0]],
      });

    const teamId = team.body.data.id as string;
    await request(ctx.app.getHttpServer())
      .patch(`/api/v1/protocol/teams/${teamId}/status`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ status: 'REVIEWED' });

    const memberRow = team.body.data.members[0];
    const record = await request(ctx.app.getHttpServer())
      .post('/api/v1/protocol/attendance')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        teamMemberId: memberRow.id,
        outcome: 'PRESENT_FULL',
      });

    expect(record.status).toBe(201);

    const profile = await ctx.prisma.protocolMemberProfile.findUnique({
      where: { memberId: ctx.memberIds[0] },
    });
    expect(profile?.attendedCount).toBe(1);

    await ctx.app.close();
  });
});
