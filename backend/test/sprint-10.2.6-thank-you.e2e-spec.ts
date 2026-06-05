import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import {
  ContributionStatus,
  ContributionType,
  FamilyMemberRole,
  MemberStatus,
  PaymentChannel,
  ThankYouDeliveryStatus,
} from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { PERMISSIONS, ROLES } from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Sprint 10.2.6 — thank-you & notifications (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let familyId: string;
  let catalogId: string;
  let headToken: string;
  let memberUserId: string;
  let memberToken: string;
  let presidentUserId: string;
  let presidentToken: string;
  let coordinatorUserId: string;

  async function grantRole(roleName: string, permissions: string[]) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      create: { name: roleName, description: roleName },
      update: {},
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const code of [...new Set(permissions)]) {
      const p = await prisma.permission.upsert({
        where: { code },
        create: { code, description: code },
        update: {},
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: p.id,
          },
        },
        create: { roleId: role.id, permissionId: p.id },
        update: {},
      });
    }
  }

  async function createUser(
    label: string,
    roleName: string,
    familyRole?: FamilyMemberRole,
  ) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
    const email = `s1026-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash('TestPass1', 10),
        isActive: true,
        member: {
          create: {
            firstName: label,
            lastName: 'ThankYou',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234567',
          },
        },
        userRoles: { create: { roleId: role.id } },
      },
      include: { member: true },
    });

    if (familyRole) {
      await prisma.familyMember.create({
        data: { familyId, memberId: user.member!.id, role: familyRole },
      });
      if (familyRole === FamilyMemberRole.HEAD) {
        await prisma.family.update({
          where: { id: familyId },
          data: { headMemberId: user.member!.id },
        });
      }
    }

    const token = await jwtService.signAsync({ sub: user.id, email });
    return { token, userId: user.id, memberId: user.member!.id };
  }

  async function createSubmitted(claimedAmount: number) {
    const member = await prisma.member.findFirstOrThrow({
      where: { userId: memberUserId },
    });
    return prisma.contributionRecord.create({
      data: {
        memberId: member.id,
        familyId,
        contributionType: ContributionType.OFFERING,
        contributionTypeCatalogId: catalogId,
        amount: claimedAmount,
        claimedAmount,
        status: ContributionStatus.SUBMITTED,
        referenceNumber: `CNT-1026-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        paymentAt: new Date(),
        paymentChannel: PaymentChannel.MOMO,
      },
    });
  }

  async function countThankYouNotifications(userId: string, contributionId: string) {
    const rows = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.filter((row) => {
      const data = row.data as Record<string, unknown> | null;
      return (
        data?.kind === 'contribution_thank_you' &&
        data?.contributionId === contributionId
      );
    }).length;
  }

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

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    await grantRole(ROLES.MEMBER, [PERMISSIONS.CHOIR_CONTRIBUTION_SUBMIT]);
    await grantRole(ROLES.CHOIR_PRESIDENT, [
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
    ]);
    await grantRole(ROLES.CHOIR_FAMILY_COORDINATOR, [
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
    ]);

    familyId = (
      await prisma.family.create({
        data: {
          familyCode: `FAM1026${Date.now()}`,
          familyName: 'Thank You Family',
          delegationEnabled: true,
        },
      })
    ).id;

    catalogId = (
      await prisma.contributionTypeCatalog.create({
        data: {
          code: `ty_cat_${Date.now()}`,
          name: 'Thank You Catalog',
          active: true,
          ministryScope: 'CHOIR',
        },
      })
    ).id;

    const member = await createUser('member', ROLES.MEMBER, FamilyMemberRole.MEMBER);
    memberToken = member.token;
    memberUserId = member.userId;

    headToken = (await createUser('head', ROLES.MEMBER, FamilyMemberRole.HEAD)).token;

    const president = await createUser('pres', ROLES.CHOIR_PRESIDENT);
    presidentToken = president.token;
    presidentUserId = president.userId;

    const coordinator = await createUser('coord', ROLES.CHOIR_FAMILY_COORDINATOR);
    coordinatorUserId = coordinator.userId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('family approve sends thank-you to member only', async () => {
    const row = await createSubmitted(8000);
    const res = await request(app.getHttpServer())
      .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
      .set('Authorization', `Bearer ${headToken}`)
      .send({ confirmedAmount: 8000 })
      .expect(201);

    expect(res.body.data.status).toBe('CONFIRMED');
    expect(res.body.data.thankYouDeliveryStatus).toBe('SENT');

    const record = await prisma.contributionRecord.findUniqueOrThrow({
      where: { id: row.id },
    });
    expect(record.thankYouDeliveryStatus).toBe(ThankYouDeliveryStatus.SENT);
    expect(record.thankYouSentAt).toBeTruthy();

    expect(await countThankYouNotifications(memberUserId, row.id)).toBe(1);

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'CONTRIBUTION_THANK_YOU_SENT', entityId: row.id },
    });
    expect(audit).toBeTruthy();

    expect(await countThankYouNotifications(presidentUserId, row.id)).toBe(0);
    expect(await countThankYouNotifications(coordinatorUserId, row.id)).toBe(0);
  });

  it('reject does not send thank-you', async () => {
    const row = await createSubmitted(5000);
    await request(app.getHttpServer())
      .post(`/api/v1/finance/contributions/${row.id}/family/reject`)
      .set('Authorization', `Bearer ${headToken}`)
      .send({ rejectionReason: 'Not accepted for test' })
      .expect(201);

    const record = await prisma.contributionRecord.findUniqueOrThrow({
      where: { id: row.id },
    });
    expect(record.thankYouDeliveryStatus).toBe(ThankYouDeliveryStatus.PENDING);
    expect(record.thankYouSentAt).toBeNull();
    expect(await countThankYouNotifications(memberUserId, row.id)).toBe(0);
  });

  it('double approve creates only one thank-you', async () => {
    const row = await createSubmitted(6000);
    await request(app.getHttpServer())
      .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
      .set('Authorization', `Bearer ${headToken}`)
      .send({ confirmedAmount: 6000 })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
      .set('Authorization', `Bearer ${headToken}`)
      .send({ confirmedAmount: 6000 })
      .expect(409);

    expect(await countThankYouNotifications(memberUserId, row.id)).toBe(1);
  });

  it('discrepancy approve sends thank-you with confirmed amount', async () => {
    const row = await createSubmitted(10000);
    await request(app.getHttpServer())
      .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
      .set('Authorization', `Bearer ${headToken}`)
      .send({
        confirmedAmount: 7500,
        discrepancyReason: 'Partial MoMo received',
      })
      .expect(201);

    const notifications = await prisma.notification.findMany({
      where: { userId: memberUserId },
      orderBy: { createdAt: 'desc' },
    });
    const thankYou = notifications.find((n) => {
      const data = n.data as Record<string, unknown>;
      return data?.kind === 'contribution_thank_you' && data?.contributionId === row.id;
    });
    expect(thankYou).toBeTruthy();
    const data = thankYou!.data as Record<string, unknown>;
    expect(data.amount).toBe(7500);
  });

  it('member sees thank-you in notification feed', async () => {
    const row = await createSubmitted(4500);
    await request(app.getHttpServer())
      .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
      .set('Authorization', `Bearer ${headToken}`)
      .send({ confirmedAmount: 4500 })
      .expect(201);

    const feed = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    const items = feed.body.data.items as Array<{ data?: { kind?: string; contributionId?: string } }>;
    const found = items.find(
      (item) =>
        item.data?.kind === 'contribution_thank_you' &&
        item.data?.contributionId === row.id,
    );
    expect(found).toBeDefined();
  });

  it('SMS disabled path still delivers in-app thank-you', async () => {
    const prev = process.env.SMS_ENABLED;
    process.env.SMS_ENABLED = 'false';

    const row = await createSubmitted(3000);
    const res = await request(app.getHttpServer())
      .post(`/api/v1/finance/contributions/${row.id}/family/approve`)
      .set('Authorization', `Bearer ${headToken}`)
      .send({ confirmedAmount: 3000 })
      .expect(201);

    expect(res.body.data.thankYouDeliveryStatus).toBe('SENT');
    const audit = await prisma.auditLog.findFirst({
      where: { action: 'CONTRIBUTION_THANK_YOU_SENT', entityId: row.id },
    });
    const payload = audit?.newValue as Record<string, unknown>;
    expect((payload.sms as Record<string, unknown>).skippedReason).toBe('sms_disabled');

    process.env.SMS_ENABLED = prev;
  });
});
