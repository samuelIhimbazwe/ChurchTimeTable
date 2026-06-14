import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { bootstrapPilotE2eApp } from './pilot-ready-e2e.helper';
import { bootstrapMemberPortalE2e } from './helpers/member-portal-e2e.helper';
import { buildRegisterPayload } from './helpers/register-payload.helper';

describe('Member onboarding (UX-FINAL-1)', () => {
  let app: INestApplication<App>;
  let memberToken: string;
  let choirId: string;

  beforeAll(async () => {
    const portal = await bootstrapMemberPortalE2e();
    app = portal.app;

    const stamp = Date.now();
    const register = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(
        buildRegisterPayload({
          email: `onboard-${stamp}@test.local`,
          firstName: 'New',
          lastName: 'Member',
          phone: `078${String(stamp).slice(-7)}`,
          nationalId: `1${String(stamp).padStart(15, '0').slice(-15)}`,
          churchRelationship: 'NEW_TO_CHURCH',
          interests: ['CHOIR', 'PROTOCOL'],
        }),
      );
    expect(register.status).toBe(201);
    memberToken = register.body.data.accessToken;

    const choirs = await request(app.getHttpServer())
      .get('/api/v1/church/public/choirs')
      .set('Authorization', `Bearer ${memberToken}`);
    choirId = choirs.body.data[0]?.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('loads member portal dashboard after registration', async () => {
    const dashboard = await request(app.getHttpServer())
      .get('/api/v1/member-portal/dashboard')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data).toHaveProperty('spiritual');
    expect(dashboard.body.data).toHaveProperty('membership');
  });

  it('discovers public choirs and submits a join request', async () => {
    expect(choirId).toBeDefined();

    const join = await request(app.getHttpServer())
      .post('/api/v1/choirs/join-requests')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ choirId, requestType: 'PERMANENT_MEMBER' });
    expect(join.status).toBe(201);

    const mine = await request(app.getHttpServer())
      .get('/api/v1/choirs/join-requests')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(mine.status).toBe(200);
    expect(mine.body.data.some((r: { choirId: string }) => r.choirId === choirId)).toBe(
      true,
    );
  });

  it('submits a protocol membership claim', async () => {
    const claim = await request(app.getHttpServer())
      .post('/api/v1/protocol/claims')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ message: 'Existing protocol member onboarding test' });
    expect(claim.status).toBe(201);

    const claims = await request(app.getHttpServer())
      .get('/api/v1/protocol/claims')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(claims.status).toBe(200);
    expect(claims.body.data.length).toBeGreaterThan(0);
  });

  it('marks onboarding complete', async () => {
    const complete = await request(app.getHttpServer())
      .patch('/api/v1/auth/onboarding-complete')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(complete.status).toBe(200);
    expect(complete.body.data.onboardingCompleted).toBe(true);
  });
});

describe('Member onboarding branding (UX-FINAL-1)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const boot = await bootstrapPilotE2eApp();
    app = boot.app;
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes church branding for guest surfaces', async () => {
    const branding = await request(app.getHttpServer()).get('/api/v1/church/public/branding');
    expect(branding.status).toBe(200);
    expect(branding.body.data.churchName).toBeTruthy();
    expect(branding.body.data.primaryColor).toBeTruthy();
  });
});
