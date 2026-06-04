import request from 'supertest';
import { bootstrapProtocolE2e } from './helpers/protocol-e2e.helper';

describe('Protocol team reports (e2e)', () => {
  it('submits team report after service', async () => {
    const ctx = await bootstrapProtocolE2e();

    await request(ctx.app.getHttpServer())
      .post('/api/v1/protocol/team-leaders')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        memberId: ctx.memberIds[0],
        isNonChoirLeader: true,
        label: 'Leader',
      });

    const team = await request(ctx.app.getHttpServer())
      .post('/api/v1/protocol/teams/generate')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        occurrenceId: ctx.occurrenceId,
        memberIds: ctx.memberIds.slice(0, 2),
      });

    const report = await request(ctx.app.getHttpServer())
      .post('/api/v1/protocol/reports')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        teamId: team.body.data.id,
        summary: 'Service completed smoothly',
        issues: 'None',
      });

    expect(report.status).toBe(201);
    expect(report.body.data.summary).toContain('smoothly');

    await ctx.app.close();
  });
});
