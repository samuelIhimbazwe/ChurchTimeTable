import request from 'supertest';
import {
  bootstrapAssetE2e,
  createTestAsset,
  type AssetE2eContext,
} from './helpers/asset-e2e.helper';

describe('Asset reporting MF-4 (e2e)', () => {
  let ctx: AssetE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapAssetE2e();
    await createTestAsset(ctx, 'RPT');
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('returns valuation report', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/assets/reports/valuation')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);
    expect(res.body.data.assetCount).toBeGreaterThan(0);
  });

  it('exports inventory CSV', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/assets/reports/inventory/export?format=csv')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);
    expect(res.text).toContain('code,name,status');
  });
});
