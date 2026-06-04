import request from 'supertest';
import { bootstrapOperationsE2e, OperationsE2eContext } from './helpers/operations-e2e.helper';

describe('Assignment rotation MF-7 (e2e)', () => {
  let ctx: OperationsE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapOperationsE2e();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('returns rotation recommendations', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get(
        `/api/v1/operations/occurrences/${ctx.occurrenceId}/recommendations?assignmentType=MAIN_CHOIR`,
      )
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
