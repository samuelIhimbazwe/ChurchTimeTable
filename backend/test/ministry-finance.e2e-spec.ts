import request from 'supertest';
import {
  bootstrapMinistryFinanceE2e,
  type MinistryFinanceE2eContext,
} from './helpers/ministry-finance-e2e.helper';

describe('Ministry finance MF-5 (e2e)', () => {
  let ctx: MinistryFinanceE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapMinistryFinanceE2e();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('returns finance summary', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/v1/ministries/${ctx.musicMinistryId}/finance/summary`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);
    expect(res.body.data.totalFundBalance).toBeGreaterThan(0);
  });

  it('lists funds with balances', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/v1/ministries/${ctx.musicMinistryId}/finance/funds`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('creates and pays expense workflow', async () => {
    const actor = await ctx.prisma.user.findFirstOrThrow({
      where: { email: { contains: 'mf5-admin' } },
      include: { member: true },
    });

    const create = await request(ctx.app.getHttpServer())
      .post(`/api/v1/ministries/${ctx.musicMinistryId}/finance/expenses`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        fundId: ctx.fundId,
        amount: 50000,
        description: 'Microphone cable',
        categoryId: ctx.categoryId,
        budgetId: ctx.budgetId,
      })
      .expect((r) => expect([200, 201]).toContain(r.status));
    ctx.expenseId = create.body.data.id;

    await request(ctx.app.getHttpServer())
      .post(
        `/api/v1/ministries/${ctx.musicMinistryId}/finance/expenses/${ctx.expenseId}/submit`,
      )
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect((r) => expect([200, 201]).toContain(r.status));

    await request(ctx.app.getHttpServer())
      .post(
        `/api/v1/ministries/${ctx.musicMinistryId}/finance/expenses/${ctx.expenseId}/approve`,
      )
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect((r) => expect([200, 201]).toContain(r.status));

    await request(ctx.app.getHttpServer())
      .post(
        `/api/v1/ministries/${ctx.musicMinistryId}/finance/expenses/${ctx.expenseId}/pay`,
      )
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect((r) => expect([200, 201]).toContain(r.status));

    expect(actor.member).toBeTruthy();
  });

  it('transfers between funds', async () => {
    const fund2 = await request(ctx.app.getHttpServer())
      .post(`/api/v1/ministries/${ctx.musicMinistryId}/finance/funds`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ name: `Welfare-${Date.now()}`, type: 'WELFARE' })
      .expect((r) => expect([200, 201]).toContain(r.status));

    await request(ctx.app.getHttpServer())
      .post(`/api/v1/ministries/${ctx.musicMinistryId}/finance/transfers`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        fromFundId: ctx.fundId,
        toFundId: fund2.body.data.id,
        amount: 10000,
        reason: 'Welfare allocation',
      })
      .expect((r) => expect([200, 201]).toContain(r.status));
  });

  it('exports finance CSV report', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get(
        `/api/v1/ministries/${ctx.musicMinistryId}/finance/reports/export?format=csv`,
      )
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);
    expect(res.text).toContain('fund,balance');
  });
});
