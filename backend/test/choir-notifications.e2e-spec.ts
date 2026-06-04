import request from 'supertest';
import {
  bootstrapChoirSchedulingE2e,
  ChoirSchedulingE2eContext,
} from './helpers/choir-scheduling-e2e.helper';

describe('Choir notifications (CHOIR-2)', () => {
  let ctx: ChoirSchedulingE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapChoirSchedulingE2e();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('creates notifications on assignment', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/choir/scheduling/assignments')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        choirId: ctx.choirId,
        occurrenceId: ctx.occurrenceId,
        role: 'SUPPORTING',
      });
    expect([200, 201]).toContain(res.status);

    const notes = await ctx.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const choirNote = notes.find((n) => {
      const data = n.data as { kind?: string } | null;
      return data?.kind === 'choir_assignment';
    });
    expect(choirNote).toBeDefined();
  });
});
