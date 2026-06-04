import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { bootstrapMemberPortalE2e } from './helpers/member-portal-e2e.helper';

describe('Mobile member portal APIs (e2e)', () => {
  let app: INestApplication<App>;
  let memberToken: string;

  beforeAll(async () => {
    const boot = await bootstrapMemberPortalE2e();
    app = boot.app;
    memberToken = boot.memberToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves member portal home summary', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/member-portal/home')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });
});
