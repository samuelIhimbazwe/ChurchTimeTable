import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { bootstrapPilotE2eApp } from './pilot-ready-e2e.helper';
import { MAIN_CHOIR_ID } from '../src/common/constants/choir.constants';

describe('Account invites (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;

  beforeAll(async () => {
    const boot = await bootstrapPilotE2eApp();
    app = boot.app;
    adminToken = boot.adminToken;
    await boot.prisma.choir.upsert({
      where: { id: MAIN_CHOIR_ID },
      create: {
        id: MAIN_CHOIR_ID,
        code: 'MAIN_CHOIR',
        name: 'Main Choir',
        isActive: true,
        isPublicJoinable: true,
      },
      update: { isActive: true },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a choir invite, accepts it, and routes login to choir home', async () => {
    const stamp = Date.now();
    const choirId = MAIN_CHOIR_ID;

    const email = `invite-choir-${stamp}@test.local`;
    const roles = await request(app.getHttpServer())
      .get(`/api/v1/choirs/position-roles?choirId=${choirId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(roles.status).toBe(200);
    const officerRole =
      roles.body.data?.find(
        (role: { name: string }) => role.name !== 'choir_member',
      ) ?? roles.body.data?.[0];
    expect(officerRole?.id).toBeTruthy();

    const created = await request(app.getHttpServer())
      .post('/api/v1/invites')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email,
        firstName: 'Invited',
        lastName: 'Singer',
        inviteType: 'CHOIR',
        choirId,
        assignedRoleId: officerRole.id,
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
