import request from 'supertest';
import { closeE2eApp } from './helpers/e2e-app.util';
import {
  bootstrapOperationsE2e,
  OperationsE2eContext,
} from './helpers/operations-e2e.helper';

describe('Operations MF-7 (e2e)', () => {
  let ctx: OperationsE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapOperationsE2e();
  });

  afterAll(async () => {
    await closeE2eApp(ctx.app);
  });

  it('lists system templates', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/operations/templates')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    const codes = res.body.data.map((t: { code: string }) => t.code);
    expect(codes).toContain('SUNDAY_SERVICE_1');
    expect(codes).toContain('IGABURO');
  });

  it('returns operations dashboard', async () => {
    await request(ctx.app.getHttpServer())
      .get('/api/v1/operations/dashboard')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);
  });

  it('creates assignment for Tuesday service', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/v1/operations/occurrences/${ctx.occurrenceId}/assignments`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ assignmentType: 'MAIN_CHOIR' })
      .expect((r) => expect([200, 201]).toContain(r.status));

    expect(res.body.data.assignmentType).toBe('MAIN_CHOIR');
  });
});
