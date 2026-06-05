import request from 'supertest';
import { closeE2eApp } from './helpers/e2e-app.util';
import {
  bootstrapMemberPortalE2e,
  MemberPortalE2eContext,
} from './helpers/member-portal-e2e.helper';

describe('Protocol invitations', () => {
  let ctx: MemberPortalE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapMemberPortalE2e();
  });

  afterAll(async () => {
    await closeE2eApp(ctx.app);
  });

  it('sends and accepts an invitation', async () => {
    const send = await request(ctx.app.getHttpServer())
      .post('/api/v1/protocol/invitations')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ memberId: ctx.memberId, message: 'Welcome to protocol' });
    expect(send.status).toBe(201);

    const accept = await request(ctx.app.getHttpServer())
      .patch(`/api/v1/protocol/invitations/${send.body.data.id}`)
      .set('Authorization', `Bearer ${ctx.memberToken}`)
      .send({ status: 'ACCEPTED' });
    expect(accept.status).toBe(200);
    expect(accept.body.data.status).toBe('ACCEPTED');
  });
});
