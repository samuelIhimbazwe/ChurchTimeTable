import request from 'supertest';
import {
  bootstrapAssetE2e,
  createTestAsset,
  type AssetE2eContext,
} from './helpers/asset-e2e.helper';

describe('Asset assignment MF-4 (e2e)', () => {
  let ctx: AssetE2eContext;
  let assetId: string;
  let assignmentId: string;

  beforeAll(async () => {
    ctx = await bootstrapAssetE2e();
    assetId = await createTestAsset(ctx, 'ASN');
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('assigns and returns asset', async () => {
    const assign = await request(ctx.app.getHttpServer())
      .post(`/api/v1/assets/${assetId}/assignments`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        assignedToType: 'MINISTRY',
        assignedToId: ctx.youthMinistryId,
        purpose: 'Conference',
      })
      .expect(200);
    assignmentId = assign.body.data.id;

    await request(ctx.app.getHttpServer())
      .post(`/api/v1/assets/${assetId}/assignments/${assignmentId}/return`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ notes: 'Returned after event' })
      .expect(200);
  });

  it('lists assignment history', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/v1/assets/${assetId}/assignments`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
