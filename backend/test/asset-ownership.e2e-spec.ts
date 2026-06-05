import request from 'supertest';
import {
  bootstrapAssetE2e,
  createTestAsset,
  type AssetE2eContext,
} from './helpers/asset-e2e.helper';

describe('Asset ownership MF-4 (e2e)', () => {
  let ctx: AssetE2eContext;
  let assetId: string;

  beforeAll(async () => {
    ctx = await bootstrapAssetE2e();
    assetId = await createTestAsset(ctx, 'OWN');
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('rejects ownership percentages over 100%', async () => {
    await request(ctx.app.getHttpServer())
      .post(`/api/v1/assets/${assetId}/ownership`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        ownerType: 'MINISTRY',
        ownerId: ctx.musicMinistryId,
        ownershipPercentage: 60,
      })
      .expect(201);

    await request(ctx.app.getHttpServer())
      .post(`/api/v1/assets/${assetId}/ownership`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        ownerType: 'MINISTRY',
        ownerId: ctx.youthMinistryId,
        ownershipPercentage: 50,
      })
      .expect(400);
  });

  it('allows church ownership without percentages', async () => {
    const id = await createTestAsset(ctx, 'CHURCH');
    await request(ctx.app.getHttpServer())
      .post(`/api/v1/assets/${id}/ownership`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ ownerType: 'CHURCH', ownerId: 'CHURCH' })
      .expect(201);
  });
});
