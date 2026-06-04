import request from 'supertest';
import { bootstrapOperationsE2e, OperationsE2eContext } from './helpers/operations-e2e.helper';

describe('Operation notifications MF-7 (e2e)', () => {
  let ctx: OperationsE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapOperationsE2e();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('creates operation notifications on assignment', async () => {
    await request(ctx.app.getHttpServer())
      .post(`/api/v1/operations/occurrences/${ctx.occurrenceId}/assignments`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ assignmentType: 'PROTOCOL_TEAM' })
      .expect((r) => expect([200, 201]).toContain(r.status));

    const count = await ctx.prisma.operationNotification.count();
    expect(count).toBeGreaterThan(0);
  });
});
