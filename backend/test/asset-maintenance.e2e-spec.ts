import request from 'supertest';
import {
  bootstrapAssetE2e,
  createTestAsset,
  type AssetE2eContext,
} from './helpers/asset-e2e.helper';

describe('Asset maintenance MF-4 (e2e)', () => {
  let ctx: AssetE2eContext;
  let assetId: string;

  beforeAll(async () => {
    ctx = await bootstrapAssetE2e();
    assetId = await createTestAsset(ctx, 'MNT');
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('creates maintenance with next date', async () => {
    await request(ctx.app.getHttpServer())
      .post(`/api/v1/assets/${assetId}/maintenance`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        type: 'INSPECTION',
        description: 'Quarterly inspection',
        nextMaintenanceDate: new Date(
          Date.now() + 86400000 * 90,
        ).toISOString(),
      })
      .expect(200);
  });

  it('lists upcoming maintenance for admin', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/assets/maintenance/upcoming')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
