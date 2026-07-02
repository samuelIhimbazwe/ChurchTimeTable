import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { bootstrapPilotE2eApp } from './pilot-ready-e2e.helper';

describe('Account invites (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;

  beforeAll(async () => {
    const boot = await bootstrapPilotE2eApp();
    app = boot.app;
    adminToken = boot.adminToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a choir invite, accepts it, and routes login to choir home', async () => {
    const stamp = Date.now();
    const choirs = await request(app.getHttpServer())
      .get('/api/v1/choirs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(choirs.status).toBe(200);
    const choirId = choirs.body.data?.[0]?.id;
    expect(choirId).toBeTruthy();

    const email = `invite-choir-${stamp}@test.local`;
    const created = await request(app.getHttpServer())
      .post('/api/v1/invites')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email,
        firstName: 'Invited',
        lastName: 'Singer',
        inviteType: 'CHOIR',
        choirId,
      });
    expect(created.status).toBe(201);
    expect(created.body.data.inviteUrl).toMatch(/accept-invite\?token=/);

    const token = new URL(created.body.data.inviteUrl).searchParams.get('token');
    expect(token).toBeTruthy();

    const preview = await request(app.getHttpServer())
      .get('/api/v1/auth/invite')
      .query({ token });
    expect(preview.status).toBe(200);
    expect(preview.body.data.email).toBe(email);

    const accepted = await request(app.getHttpServer())
      .post('/api/v1/auth/accept-invite')
      .send({
        token,
        password: 'InvitePass1',
        acceptedTerms: true,
      });
    expect(accepted.status).toBe(201);
    expect(accepted.body.data.accessToken).toBeDefined();

    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accepted.body.data.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.accessRouting.hasChoirMembership).toBe(true);
    expect(me.body.data.accessRouting.homePath).toContain(`/choir/${choirId}/`);
  });
});
