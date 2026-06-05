import request from 'supertest';
import { closeE2eApp } from './helpers/e2e-app.util';
import {
  bootstrapMemberPortalE2e,
  MemberPortalE2eContext,
} from './helpers/member-portal-e2e.helper';

describe('Choir join requests', () => {
  let ctx: MemberPortalE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapMemberPortalE2e();
  });

  afterAll(async () => {
    await closeE2eApp(ctx.app);
  });

  it('submits and approves a join request', async () => {
    const submit = await request(ctx.app.getHttpServer())
      .post('/api/v1/choirs/join-requests')
      .set('Authorization', `Bearer ${ctx.memberToken}`)
      .send({ choirId: ctx.elimChoirId, requestType: 'PERMANENT_MEMBER' });
    expect(submit.status).toBe(201);

    const approve = await request(ctx.app.getHttpServer())
      .patch(`/api/v1/choirs/join-requests/${submit.body.data.id}`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ status: 'APPROVED' });
    expect(approve.status).toBe(200);
    expect(approve.body.data.status).toBe('APPROVED');
  });
});
