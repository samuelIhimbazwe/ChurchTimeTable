import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { MemberStatus } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { ROLES } from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';
import { MINISTRY_SERVICES_AUDIT } from '../src/ministry-services/ministry-services.constants';

describe('Ministry Services MF-3 (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let scopedToken: string;
  let musicMinistryId: string;
  let youthMinistryId: string;
  let memberAId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    const prisma = app.get(PrismaService);
    const music = await prisma.ministry.findUniqueOrThrow({
      where: { code: 'MUSIC' },
    });
    const youth = await prisma.ministry.findUniqueOrThrow({
      where: { code: 'YOUTH' },
    });
    musicMinistryId = music.id;
    youthMinistryId = youth.id;

    await prisma.ministrySettings.upsert({
      where: { ministryId: musicMinistryId },
      create: {
        ministryId: musicMinistryId,
        allowAnnouncements: true,
        allowDocuments: true,
        allowMeetings: true,
        allowDevotions: true,
      },
      update: {
        allowAnnouncements: true,
        allowDocuments: true,
        allowMeetings: true,
        allowDevotions: true,
      },
    });

    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.SUPER_ADMIN },
    });
    const memberRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.MEMBER },
    });

    const passwordHash = await bcrypt.hash('TestPass1', 10);
    const ts = Date.now();

    await prisma.user.create({
      data: {
        email: `mf3-admin-${ts}@test.local`,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'MF3',
            lastName: 'Admin',
            ministry: 'BOTH',
            status: MemberStatus.ACTIVE,
            phone: `0790${String(ts).slice(-6)}`,
          },
        },
        userRoles: { create: { roleId: adminRole.id } },
      },
    });

    const memberUser = await prisma.user.create({
      data: {
        email: `mf3-member-${ts}@test.local`,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'MF3',
            lastName: 'Member',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: `0791${String(ts).slice(-6)}`,
          },
        },
        userRoles: { create: { roleId: memberRole.id } },
      },
      include: { member: true },
    });
    memberAId = memberUser.member!.id;

    await prisma.ministryMembership.create({
      data: {
        ministryId: youthMinistryId,
        memberId: memberAId,
        status: 'ACTIVE',
      },
    });
    await prisma.ministryPermissionAssignment.create({
      data: {
        ministryId: youthMinistryId,
        memberId: memberAId,
        permission: 'ministry.view',
      },
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: `mf3-admin-${ts}@test.local`, password: 'TestPass1' });
    adminToken = adminLogin.body.data.accessToken;

    const memberLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: `mf3-member-${ts}@test.local`, password: 'TestPass1' });
    scopedToken = memberLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('manages announcements with pin and read tracking', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ministryId: musicMinistryId,
        title: 'MF3 Choir Rehearsal',
        content: 'Thursday at 6pm',
        priority: 'HIGH',
        audienceType: 'ALL_MINISTRY',
      });
    expect(createRes.status).toBe(201);
    const announcementId = createRes.body.data.id;

    const publishRes = await request(app.getHttpServer())
      .post(`/api/v1/announcements/${announcementId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(publishRes.status).toBe(201);
    expect(publishRes.body.data.publishedAt).toBeTruthy();

    const pinRes = await request(app.getHttpServer())
      .post(`/api/v1/announcements/${announcementId}/pin`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pinRes.status).toBe(201);
    expect(pinRes.body.data.isPinned).toBe(true);

    const listRes = await request(app.getHttpServer())
      .get(`/api/v1/ministries/${musicMinistryId}/announcements`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    expect(
      listRes.body.data.some((a: { id: string }) => a.id === announcementId),
    ).toBe(true);

    const readRes = await request(app.getHttpServer())
      .post(`/api/v1/announcements/${announcementId}/read`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(readRes.status).toBe(201);

    const audit = await app.get(PrismaService).auditLog.findFirst({
      where: {
        action: MINISTRY_SERVICES_AUDIT.ANNOUNCEMENT_CREATED,
        entityId: announcementId,
      },
    });
    expect(audit).toBeTruthy();
  });

  it('uploads documents with version history', async () => {
    const uploadRes = await request(app.getHttpServer())
      .post(`/api/v1/ministries/${musicMinistryId}/documents`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Music Ministry Handbook',
        description: 'Policies',
        category: 'POLICY',
        fileUrl: 'https://example.com/handbook-v1.pdf',
        fileName: 'handbook-v1.pdf',
      });
    expect(uploadRes.status).toBe(201);
    const documentId = uploadRes.body.data.id;

    const versionRes = await request(app.getHttpServer())
      .post(`/api/v1/ministries/${musicMinistryId}/documents/${documentId}/versions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Music Ministry Handbook',
        fileUrl: 'https://example.com/handbook-v2.pdf',
        fileName: 'handbook-v2.pdf',
        changeNotes: 'Annual update',
      });
    expect(versionRes.status).toBe(201);

    const getDocRes = await request(app.getHttpServer())
      .get(`/api/v1/ministries/${musicMinistryId}/documents/${documentId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getDocRes.status).toBe(200);
    expect(getDocRes.body.data.versions.length).toBeGreaterThanOrEqual(2);

    const audit = await app.get(PrismaService).auditLog.findFirst({
      where: {
        action: MINISTRY_SERVICES_AUDIT.DOCUMENT_UPLOADED,
        entityId: documentId,
      },
    });
    expect(audit).toBeTruthy();
  });

  it('runs meetings with decisions and action items', async () => {
    const scheduledAt = new Date(Date.now() + 86400000).toISOString();
    const createRes = await request(app.getHttpServer())
      .post(`/api/v1/ministries/${musicMinistryId}/meetings`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Music Leadership Sync',
        description: 'Monthly planning',
        scheduledAt,
        location: 'Choir room',
      });
    expect(createRes.status).toBe(201);
    const meetingId = createRes.body.data.id;

    const decisionRes = await request(app.getHttpServer())
      .post(`/api/v1/ministries/${musicMinistryId}/meetings/${meetingId}/decisions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ summary: 'Approve new song list' });
    expect(decisionRes.status).toBe(201);

    const actionRes = await request(app.getHttpServer())
      .post(`/api/v1/ministries/${musicMinistryId}/meetings/${meetingId}/action-items`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Print sheet music',
        assigneeId: memberAId,
        dueDate: new Date(Date.now() + 172800000).toISOString(),
      });
    expect(actionRes.status).toBe(201);
    const actionItemId = actionRes.body.data.id;

    const completeRes = await request(app.getHttpServer())
      .patch(
        `/api/v1/ministries/${musicMinistryId}/meetings/${meetingId}/action-items/${actionItemId}/complete`,
      )
      .set('Authorization', `Bearer ${adminToken}`);
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('DONE');

    const completeMeeting = await request(app.getHttpServer())
      .patch(`/api/v1/ministries/${musicMinistryId}/meetings/${meetingId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'COMPLETED' });
    expect(completeMeeting.status).toBe(200);

    const audit = await app.get(PrismaService).auditLog.findFirst({
      where: {
        action: MINISTRY_SERVICES_AUDIT.MEETING_CREATED,
        entityId: meetingId,
      },
    });
    expect(audit).toBeTruthy();
  });

  it('returns dashboard, activity, and reports', async () => {
    const dashboardRes = await request(app.getHttpServer())
      .get(`/api/v1/ministries/${musicMinistryId}/dashboard`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(dashboardRes.status).toBe(200);
    expect(dashboardRes.body.data.ministryId).toBe(musicMinistryId);
    expect(dashboardRes.body.data.announcements).toBeDefined();

    const activityRes = await request(app.getHttpServer())
      .get(`/api/v1/ministries/${musicMinistryId}/activity`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(activityRes.status).toBe(200);
    expect(Array.isArray(activityRes.body.data)).toBe(true);

    const summaryRes = await request(app.getHttpServer())
      .get(`/api/v1/ministries/${musicMinistryId}/reports/summary`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(summaryRes.status).toBe(200);
    expect(typeof summaryRes.body.data.metrics.members).toBe('number');

    const csvRes = await request(app.getHttpServer())
      .get(`/api/v1/ministries/${musicMinistryId}/reports/csv`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(csvRes.status).toBe(200);
    expect(csvRes.text).toContain('members');

    const pdfRes = await request(app.getHttpServer())
      .get(`/api/v1/ministries/${musicMinistryId}/reports/pdf`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toContain('pdf');
  });

  it('isolates ministry content for scoped members', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ministryId: musicMinistryId,
        title: 'Music-only notice',
        content: 'Hidden from youth member',
        audienceType: 'ALL_MINISTRY',
      });
    expect(createRes.status).toBe(201);
    await request(app.getHttpServer())
      .post(`/api/v1/announcements/${createRes.body.data.id}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);

    const denied = await request(app.getHttpServer())
      .get(`/api/v1/ministries/${musicMinistryId}/announcements`)
      .set('Authorization', `Bearer ${scopedToken}`);
    expect(denied.status).toBe(403);
  });

  it('includes ministry content in global search for admins', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/search')
      .query({ q: 'MF3 Choir' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(
      res.body.data.ministryContent?.some(
        (r: { type: string }) => r.type === 'ministryAnnouncement',
      ),
    ).toBe(true);
  });

  it('publishes ministry devotions', async () => {
    const createRes = await request(app.getHttpServer())
      .post(`/api/v1/ministries/${musicMinistryId}/devotions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Ministry devotion MF3',
        content: 'Be strong and courageous',
        type: 'ENCOURAGEMENT',
      });
    expect(createRes.status).toBe(201);
    const devotionId = createRes.body.data.id;

    const publishRes = await request(app.getHttpServer())
      .post(`/api/v1/ministries/${musicMinistryId}/devotions/${devotionId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(publishRes.status).toBe(201);
    expect(publishRes.body.data.publishedAt).toBeTruthy();
  });
});
