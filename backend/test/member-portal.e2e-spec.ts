import request from 'supertest';
import {
  bootstrapMemberPortalE2e,
  MemberPortalE2eContext,
} from './helpers/member-portal-e2e.helper';

describe('Member portal (MEMBER-PORTAL-1)', () => {
  let ctx: MemberPortalE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapMemberPortalE2e();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('returns church member dashboard', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/member-portal/dashboard')
      .set('Authorization', `Bearer ${ctx.memberToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('spiritual');
    expect(res.body.data).toHaveProperty('membership');
  });
});
