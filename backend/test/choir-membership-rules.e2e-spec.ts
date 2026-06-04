import request from 'supertest';
import {
  bootstrapMemberPortalE2e,
  MemberPortalE2eContext,
} from './helpers/member-portal-e2e.helper';

describe('Choir membership rules', () => {
  let ctx: MemberPortalE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapMemberPortalE2e();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('allows primary + Yerusalemu and blocks two primaries', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/v1/choirs/join-requests')
      .set('Authorization', `Bearer ${ctx.memberToken}`)
      .send({ choirId: ctx.elimChoirId })
      .then(async (r1) => {
        await request(ctx.app.getHttpServer())
          .patch(`/api/v1/choirs/join-requests/${r1.body.data.id}`)
          .set('Authorization', `Bearer ${ctx.adminToken}`)
          .send({ status: 'APPROVED' });
      });

    const yeru = await request(ctx.app.getHttpServer())
      .post('/api/v1/choirs/join-requests')
      .set('Authorization', `Bearer ${ctx.memberToken}`)
      .send({ choirId: ctx.yerusalemuChoirId });
    expect(yeru.status).toBe(201);

    const secondPrimary = await request(ctx.app.getHttpServer())
      .post('/api/v1/choirs/join-requests')
      .set('Authorization', `Bearer ${ctx.memberToken}`)
      .send({ choirId: ctx.integuzaChoirId });
    expect(secondPrimary.status).toBe(400);
  });
});
