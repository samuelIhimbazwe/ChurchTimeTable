import request from 'supertest';
import {
  bootstrapAssetE2e,
  createTestAsset,
  type AssetE2eContext,
} from './helpers/asset-e2e.helper';

describe('Cross-ministry asset isolation MF-4 (e2e)', () => {
  let ctx: AssetE2eContext;
  let isolatedAssetId: string;

  beforeAll(async () => {
    ctx = await bootstrapAssetE2e();
    isolatedAssetId = await createTestAsset(ctx, 'ISO');
    await request(ctx.app.getHttpServer())
      .post(`/api/v1/assets/${isolatedAssetId}/ownership`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        ownerType: 'MINISTRY',
        ownerId: ctx.youthMinistryId,
        ownershipPercentage: 100,
      })
      .expect(201);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('member in music ministry cannot view youth-only asset', async () => {
    await request(ctx.app.getHttpServer())
      .get(`/api/v1/assets/${isolatedAssetId}`)
      .set('Authorization', `Bearer ${ctx.memberToken}`)
      .expect(403);
  });

  it('admin can view youth-owned asset', async () => {
    await request(ctx.app.getHttpServer())
      .get(`/api/v1/assets/${isolatedAssetId}`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);
  });
});
