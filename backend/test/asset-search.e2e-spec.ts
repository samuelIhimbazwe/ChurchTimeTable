import request from 'supertest';
import { closeE2eApp } from './helpers/e2e-app.util';
import {
  bootstrapAssetE2e,
  createTestAsset,
  type AssetE2eContext,
} from './helpers/asset-e2e.helper';

describe('Asset search MF-4 (e2e)', () => {
  let ctx: AssetE2eContext;

  beforeAll(async () => {
    ctx = await bootstrapAssetE2e();
    await createTestAsset(ctx, 'SRCH-KEYBOARD');
  });

  afterAll(async () => {
    await closeE2eApp(ctx.app);
  });

  it('includes assets in global search for admin', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/search')
      .query({ q: 'SRCH-KEYBOARD' })
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);
    expect(res.body.data.assets?.length ?? 0).toBeGreaterThan(0);
  });

  it('hides assets from member without asset.view', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/search')
      .query({ q: 'SRCH-KEYBOARD' })
      .set('Authorization', `Bearer ${ctx.memberToken}`)
      .expect(200);
    expect(res.body.data.assets ?? []).toEqual([]);
  });
});
