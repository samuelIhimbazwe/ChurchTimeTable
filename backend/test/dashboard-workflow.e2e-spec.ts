import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  bootstrapUxFinalE2e,
  UxFinalE2eContext,
} from './helpers/ux-final-e2e.helper';

describe('Dashboard workflow (UX-FINAL-1)', () => {
  let ctx: UxFinalE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapUxFinalE2e();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('serves member portal dashboard for church members', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/member-portal/dashboard')
      .set('Authorization', `Bearer ${ctx.memberToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('spiritual');
  });

  it('serves leader dashboard summary', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/dashboard/leader-summary')
      .set('Authorization', `Bearer ${ctx.choirPresidentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('widgets');
  });

  it('serves choir president scheduling dashboard', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/v1/choir/scheduling/dashboard?choirId=${ctx.elimChoirId}`)
      .set('Authorization', `Bearer ${ctx.choirPresidentToken}`)
      .set('x-choir-id', ctx.elimChoirId);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('upcomingServices');
  });

  it('lists pending choir join requests for reviewers', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/v1/choirs/join-requests')
      .set('Authorization', `Bearer ${ctx.memberToken}`)
      .send({ choirId: ctx.elimChoirId, requestType: 'PERMANENT_MEMBER' });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/choirs/join-requests?status=PENDING')
      .set('Authorization', `Bearer ${ctx.choirPresidentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('serves protocol coordinator dashboard', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/protocol/dashboard')
      .set('Authorization', `Bearer ${ctx.protocolCoordinatorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('upcomingTeams');
    expect(res.body.data).toHaveProperty('pendingReplacements');
  });

  it('lists protocol claims for coordinators', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/v1/protocol/claims')
      .set('Authorization', `Bearer ${ctx.memberToken}`)
      .send({ message: 'Dashboard workflow claim' });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/protocol/claims')
      .set('Authorization', `Bearer ${ctx.protocolCoordinatorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((c: { status: string }) => c.status === 'PENDING')).toBe(
      true,
    );
  });

  it('serves protocol team leader dashboard', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/protocol/dashboard/team-leader')
      .set('Authorization', `Bearer ${ctx.protocolCoordinatorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('teams');
  });
});
