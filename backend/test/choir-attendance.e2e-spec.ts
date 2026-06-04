import request from 'supertest';
import {
  bootstrapChoirSchedulingE2e,
  ChoirSchedulingE2eContext,
} from './helpers/choir-scheduling-e2e.helper';

describe('Choir attendance (CHOIR-2)', () => {
  let ctx: ChoirSchedulingE2eContext;
  let activityId: string;

  beforeAll(async () => {
    ctx = await bootstrapChoirSchedulingE2e();
    const start = new Date();
    start.setDate(start.getDate() + 3);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    const act = await request(ctx.app.getHttpServer())
      .post('/api/v1/choir/scheduling/activities')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        choirId: ctx.choirId,
        title: 'Rehearsal test',
        activityType: 'REHEARSAL',
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });
    activityId = act.body.data.id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('records attendance and refreshes participation', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/choir/scheduling/attendance')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        activityId,
        memberId: ctx.memberIds[0],
        outcome: 'PRESENT_FULL',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.scoreEarned).toBe(100);

    const profile = await ctx.prisma.choirMemberParticipationProfile.findUnique({
      where: {
        choirId_memberId: { choirId: ctx.choirId, memberId: ctx.memberIds[0] },
      },
    });
    expect(profile?.rehearsalsAttended).toBeGreaterThanOrEqual(1);
  });
});
