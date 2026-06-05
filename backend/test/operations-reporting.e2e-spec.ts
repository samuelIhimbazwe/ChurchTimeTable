import request from 'supertest';
import { closeE2eApp } from './helpers/e2e-app.util';
import { bootstrapOperationsE2e, OperationsE2eContext } from './helpers/operations-e2e.helper';

describe('Operations reporting MF-7 (e2e)', () => {
  let ctx: OperationsE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapOperationsE2e();
  });

  afterAll(async () => {
    await closeE2eApp(ctx.app);
  });

  it('lists report catalog', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/operations/reports')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
