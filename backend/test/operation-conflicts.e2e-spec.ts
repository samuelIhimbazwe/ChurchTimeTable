import request from 'supertest';
import { closeE2eApp } from './helpers/e2e-app.util';
import { bootstrapOperationsE2e, OperationsE2eContext } from './helpers/operations-e2e.helper';

describe('Operation conflicts MF-7 (e2e)', () => {
  let ctx: OperationsE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapOperationsE2e();
  });

  afterAll(async () => {
    await closeE2eApp(ctx.app);
  });

  it('lists conflicts for occurrence', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/v1/operations/occurrences/${ctx.occurrenceId}/conflicts`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
