import request from 'supertest';
import {
  bootstrapChoirSchedulingE2e,
  ChoirSchedulingE2eContext,
} from './helpers/choir-scheduling-e2e.helper';
import { closeE2eApp } from './helpers/e2e-app.util';

describe('Choir notifications (CHOIR-2)', () => {
  let ctx: ChoirSchedulingE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapChoirSchedulingE2e();
  });

  afterAll(async () => {
    await closeE2eApp(ctx.app);
  });

  it('creates notifications on assignment', async () => {
    const startedAt = new Date();
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/choir/scheduling/assignments')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        choirId: ctx.choirId,
        occurrenceId: ctx.occurrenceId,
        role: 'SUPPORTING',
      });
    expect([200, 201]).toContain(res.status);

    let choirNote: { id: string } | undefined;
    for (let attempt = 0; attempt < 15; attempt += 1) {
      const notes = await ctx.prisma.notification.findMany({
        where: { createdAt: { gte: startedAt } },
        orderBy: { createdAt: 'desc' },
      });
      choirNote = notes.find((n) => {
        const data = n.data as { kind?: string } | null;
        return (
          data?.kind === 'choir_assignment' ||
          n.title.toLowerCase().includes('choir assignment')
        );
      });
      if (choirNote) break;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    expect(choirNote).toBeDefined();
  });
});
