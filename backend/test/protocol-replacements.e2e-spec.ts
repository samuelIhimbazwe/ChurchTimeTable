import request from 'supertest';
import { closeE2eApp } from './helpers/e2e-app.util';
import { bootstrapProtocolE2e } from './helpers/protocol-e2e.helper';

describe('Protocol replacements (e2e)', () => {
  it('approves self-found replacement workflow', async () => {
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

    const teamMemberId = team.body.data.members[0].id as string;

    const req = await request(ctx.app.getHttpServer())
      .post('/api/v1/protocol/replacements')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        teamMemberId,
        replacementMemberId: ctx.memberIds[1],
        reason: 'Travel',
      });

    expect(req.status).toBe(201);

    const approved = await request(ctx.app.getHttpServer())
      .patch(`/api/v1/protocol/replacements/${req.body.data.id}`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ status: 'APPROVED' });

    expect(approved.status).toBe(200);

    const attendance = await ctx.prisma.protocolTeamAttendance.findUnique({
      where: { teamMemberId },
    });
    expect(attendance?.outcome).toBe('ABSENT_SELF_REPLACED');

    await closeE2eApp(ctx.app);
  });
});
