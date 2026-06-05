import request from 'supertest';
import { closeE2eApp } from './helpers/e2e-app.util';
import {
  bootstrapMemberPortalE2e,
  MemberPortalE2eContext,
} from './helpers/member-portal-e2e.helper';

describe('Protocol membership claims', () => {
  let ctx: MemberPortalE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapMemberPortalE2e();
  });

  afterAll(async () => {
    await closeE2eApp(ctx.app);
  });

  it('submits and approves a claim', async () => {
    const submit = await request(ctx.app.getHttpServer())
      .post('/api/v1/protocol/claims')
      .set('Authorization', `Bearer ${ctx.memberToken}`)
      .send({ message: 'I am already a protocol member' });
    expect(submit.status).toBe(201);

    const approve = await request(ctx.app.getHttpServer())
      .patch(`/api/v1/protocol/claims/${submit.body.data.id}`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ status: 'APPROVED' });
    expect(approve.status).toBe(200);
  });
});
