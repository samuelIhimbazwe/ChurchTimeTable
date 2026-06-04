import request from 'supertest';
import {
  bootstrapOperationsE2e,
  OperationsE2eContext,
} from './helpers/operations-e2e.helper';

describe('Service rules MF-7 (e2e)', () => {
  let ctx: OperationsE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapOperationsE2e();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('rejects CHILDREN_CHOIR on Tuesday service', async () => {
    const children = await ctx.prisma.operationalUnit.findFirst({
      where: { code: 'CHILDREN_CHOIR' },
    });
    if (!children) return;

    await request(ctx.app.getHttpServer())
      .post(`/api/v1/operations/occurrences/${ctx.occurrenceId}/assignments`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        assignmentType: 'CHILDREN_CHOIR',
        operationalUnitId: children.id,
      })
      .expect(400);
  });
});
