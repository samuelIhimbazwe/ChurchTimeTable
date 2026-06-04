import request from 'supertest';
import {
  bootstrapMinistryFinanceE2e,
  type MinistryFinanceE2eContext,
} from './helpers/ministry-finance-e2e.helper';

describe('Ministry funds MF-5 (e2e)', () => {
  let ctx: MinistryFinanceE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapMinistryFinanceE2e();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('lists funds', async () => {
    await request(ctx.app.getHttpServer())
      .get(`/api/v1/ministries/${ctx.musicMinistryId}/finance/funds`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);
  });
});
