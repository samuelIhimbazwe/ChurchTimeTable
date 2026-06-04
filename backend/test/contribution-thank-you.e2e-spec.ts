import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { ContributionType, MemberStatus } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { ROLES, PERMISSIONS } from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Contribution thank-you (e2e)', () => {
  let app: INestApplication<App>;
  let memberToken: string;
  let treasurerToken: string;
  let memberId: string;
  let contributionId: string;

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
    const memberRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.MEMBER },
    });
    const treasurerRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.CHOIR_TREASURER },
    });

    for (const code of [
      PERMISSIONS.CHOIR_FINANCE_VIEW,
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
      PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
    ]) {
      const permission = await prisma.permission.upsert({
        where: { code },
        create: { code, description: code },
        update: {},
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: treasurerRole.id,
            permissionId: permission.id,
          },
        },
        create: { roleId: treasurerRole.id, permissionId: permission.id },
        update: {},
      });
    }

    const memberEmail = `thankyou-member-${Date.now()}@test.local`;
    const treasurerEmail = `thankyou-treasurer-${Date.now()}@test.local`;
    const passwordHash = await bcrypt.hash('TestPass1', 10);

    const memberUser = await prisma.user.create({
      data: {
        email: memberEmail,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Thank',
            lastName: 'Member',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234567',
          },
        },
        userRoles: { create: { roleId: memberRole.id } },
      },
      include: { member: true },
    });
    memberId = memberUser.member!.id;

    await prisma.user.create({
      data: {
        email: treasurerEmail,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Thank',
            lastName: 'Treasurer',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234568',
          },
        },
        userRoles: { create: { roleId: treasurerRole.id } },
      },
    });

    const memberLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: memberEmail, password: 'TestPass1' });
    memberToken = memberLogin.body.data.accessToken;

    const treasurerLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: treasurerEmail, password: 'TestPass1' });
    treasurerToken = treasurerLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('confirmation triggers thank-you delivery', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/finance/contributions')
      .set('Authorization', `Bearer ${treasurerToken}`)
      .send({
        memberId,
        contributionType: ContributionType.OFFERING,
        amount: 1500,
      })
      .expect(201);

    contributionId = created.body.data.id;

    await request(app.getHttpServer())
      .post(`/api/v1/finance/contributions/${contributionId}/submit`)
      .set('Authorization', `Bearer ${treasurerToken}`)
      .expect(201);

    const confirmed = await request(app.getHttpServer())
      .post(`/api/v1/finance/contributions/${contributionId}/confirm`)
      .set('Authorization', `Bearer ${treasurerToken}`)
      .expect(201);

    expect(confirmed.body.data.thankYouDeliveryStatus).toBe('SENT');
    expect(confirmed.body.data.thankYouSentAt).toBeTruthy();
  });

  it('notification appears in member feed', async () => {
    const notifications = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    const items = notifications.body.data.items as Array<{
      data?: { kind?: string; contributionId?: string };
    }>;
    const thankYou = items.find(
      (item) =>
        item.data?.kind === 'contribution_thank_you' &&
        item.data?.contributionId === contributionId,
    );
    expect(thankYou).toBeDefined();
  });

  it('member sees acknowledgment status on my-contributions', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/finance/my-contributions')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    const record = (
      res.body.data.contributionRecords as Array<{
        id: string;
        thankYouDeliveryStatus?: string;
      }>
    ).find((row) => row.id === contributionId);
    expect(record?.thankYouDeliveryStatus).toBe('SENT');
  });

  it('stewardship analytics includes thank-you metrics for treasurer', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/finance/stewardship/analytics')
      .set('Authorization', `Bearer ${treasurerToken}`)
      .expect(200);

    expect(res.body.data.contributions.thankYou.totalSent).toBeGreaterThan(0);
  });

  it('resend endpoint works for treasurer', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/finance/contributions/${contributionId}/resend-thank-you`)
      .set('Authorization', `Bearer ${treasurerToken}`)
      .expect(201);

    expect(res.body.data.thankYouDeliveryStatus).toBe('SENT');
    expect(res.body.data.thankYouSentAt).toBeTruthy();
  });

  it('member cannot resend thank-you', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/finance/contributions/${contributionId}/resend-thank-you`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });

  it('member cannot see stewardship thank-you metrics', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/finance/stewardship/analytics')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });
});
