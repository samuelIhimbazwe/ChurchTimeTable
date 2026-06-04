import request from 'supertest';
import { bootstrapProtocolE2e } from './helpers/protocol-e2e.helper';

describe('Protocol statistics (e2e)', () => {
  it('exposes leader dashboard and settings', async () => {
    const ctx = await bootstrapProtocolE2e();

    const dash = await request(ctx.app.getHttpServer())
      .get('/api/v1/protocol/dashboard')
      .set('Authorization', `Bearer ${ctx.adminToken}`);

    expect(dash.status).toBe(200);
    expect(dash.body.data).toHaveProperty('upcomingTeams');

    const settings = await request(ctx.app.getHttpServer())
      .get('/api/v1/protocol/settings')
      .set('Authorization', `Bearer ${ctx.adminToken}`);

    expect(settings.status).toBe(200);
    expect(settings.body.data.maxOfficialServicesPerMonth).toBe(3);

    await ctx.app.close();
  });
});
