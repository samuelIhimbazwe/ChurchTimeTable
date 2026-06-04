import request from 'supertest';
import {
  bootstrapMemberPortalE2e,
  MemberPortalE2eContext,
} from './helpers/member-portal-e2e.helper';

describe('Dashboard switching', () => {
  let ctx: MemberPortalE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapMemberPortalE2e();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('returns role-based dashboard list', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/member-portal/dashboard-context')
      .set('Authorization', `Bearer ${ctx.memberToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.dashboards.some((d: { key: string }) => d.key === 'member')).toBe(
      true,
    );
  });

  it('includes admin dashboard for super admin', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/member-portal/dashboard-context')
      .set('Authorization', `Bearer ${ctx.adminToken}`);
    expect(res.body.data.dashboards.some((d: { key: string }) => d.key === 'admin')).toBe(
      true,
    );
  });
});
