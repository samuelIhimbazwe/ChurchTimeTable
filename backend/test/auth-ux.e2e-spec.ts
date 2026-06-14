import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { bootstrapPilotE2eApp } from './pilot-ready-e2e.helper';
import { buildRegisterPayload } from './helpers/register-payload.helper';

describe('Auth UX (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const boot = await bootstrapPilotE2eApp();
    app = boot.app;
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves public welcome and branding', async () => {
    const welcome = await request(app.getHttpServer()).get('/api/v1/church/public/welcome');
    expect(welcome.status).toBe(200);
    expect(welcome.body.data).toHaveProperty('branding');

    const branding = await request(app.getHttpServer()).get('/api/v1/church/public/branding');
    expect(branding.status).toBe(200);
    expect(branding.body.data).toHaveProperty('churchName');
  });

  it('registers church members without ministry selection', async () => {
    const stamp = Date.now();
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(
        buildRegisterPayload({
          email: `auth-ux-${stamp}@test.local`,
          firstName: 'Church',
          lastName: 'Member',
          phone: `078${String(stamp).slice(-7)}`,
          nationalId: `1${String(stamp).padStart(15, '0').slice(-15)}`,
          churchRelationship: 'NEW_TO_CHURCH',
          interests: ['CHOIR', 'YOUTH'],
        }),
      );
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeDefined();
  });
});
