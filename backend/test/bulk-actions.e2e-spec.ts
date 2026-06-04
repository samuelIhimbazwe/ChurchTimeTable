import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { bootstrapPilotE2eApp } from './pilot-ready-e2e.helper';

describe('Bulk actions (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let memberId: string;

  beforeAll(async () => {
    const boot = await bootstrapPilotE2eApp();
    app = boot.app;
    adminToken = boot.adminToken;
    const member = await boot.prisma.member.findFirst({
      where: { user: { email: { contains: 'pilot-admin-' } } },
    });
    memberId = member!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('bulk activates and deactivates members', async () => {
    const deactivate = await request(app.getHttpServer())
      .post('/api/v1/pilot/bulk/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'DEACTIVATE', memberIds: [memberId] });
    expect(deactivate.status).toBe(201);
    expect(deactivate.body.data.success).toBe(1);

    const activate = await request(app.getHttpServer())
      .post('/api/v1/pilot/bulk/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'ACTIVATE', memberIds: [memberId] });
    expect(activate.status).toBe(201);
    expect(activate.body.data.success).toBe(1);
  });
});
