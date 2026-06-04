import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import {
  ContributionCampaignStatus,
  FamilyMemberRole,
  MemberStatus,
  PaymentChannel,
} from '@prisma/client';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { PERMISSIONS, ROLES } from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Sprint 10.2.1 — member submission (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let familyId: string;
  let catalogActiveId: string;
  let catalogInactiveId: string;
  let campaignActiveId: string;
  let campaignDraftId: string;

  let memberToken: string;
  let memberId: string;
  let headToken: string;
  let memberNoFamilyToken: string;
  let memberNoPhoneToken: string;

  async function grantRole(roleName: string, permissions: string[]) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      create: { name: roleName, description: roleName },
      update: {},
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const code of permissions) {
      const permission = await prisma.permission.upsert({
        where: { code },
        create: { code, description: code },
        update: {},
      });
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: permission.id },
      });
    }
    return role;
  }

  async function createChoirUser(
    label: string,
    options?: {
      familyId?: string;
      familyRole?: FamilyMemberRole;
      phone?: string | null;
    },
  ) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.MEMBER },
    });
    const email = `s1021-${label}-${Date.now()}@test.local`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash('TestPass1', 10),
        isActive: true,
        member: {
          create: {
            firstName: label,
            lastName: 'User',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: options && 'phone' in options ? options.phone : '0781234567',
          },
        },
        userRoles: { create: { roleId: role.id } },
      },
      include: { member: true },
    });

    if (options?.familyId && options.familyRole) {
      await prisma.familyMember.create({
        data: {
          familyId: options.familyId,
          memberId: user.member!.id,
          role: options.familyRole,
        },
      });
      if (options.familyRole === FamilyMemberRole.HEAD) {
        await prisma.family.update({
          where: { id: options.familyId },
          data: { headMemberId: user.member!.id },
        });
      }
    }

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPass1' });

    return {
      token: login.body.data.accessToken as string,
      memberId: user.member!.id,
      email,
    };
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

    await grantRole(ROLES.MEMBER, [PERMISSIONS.CHOIR_CONTRIBUTION_SUBMIT]);

    const family = await prisma.family.create({
      data: {
        familyCode: `FAM${Date.now()}`,
        familyName: 'Submission Test Family',
        delegationEnabled: false,
      },
    });
    familyId = family.id;

    const activeCatalog = await prisma.contributionTypeCatalog.create({
      data: {
        code: `active_type_${Date.now()}`,
        name: 'Active Type',
        active: true,
        ministryScope: 'CHOIR',
      },
    });
    catalogActiveId = activeCatalog.id;

    const inactiveCatalog = await prisma.contributionTypeCatalog.create({
      data: {
        code: `inactive_type_${Date.now()}`,
        name: 'Inactive Type',
        active: false,
        ministryScope: 'CHOIR',
      },
    });
    catalogInactiveId = inactiveCatalog.id;

    const activeCampaign = await prisma.contributionCampaign.create({
      data: {
        contributionTypeId: catalogActiveId,
        name: 'Active Campaign',
        goalAmount: 100000,
        status: ContributionCampaignStatus.ACTIVE,
      },
    });
    campaignActiveId = activeCampaign.id;

    const draftCampaign = await prisma.contributionCampaign.create({
      data: {
        contributionTypeId: catalogActiveId,
        name: 'Draft Campaign',
        goalAmount: 50000,
        status: ContributionCampaignStatus.DRAFT,
      },
    });
    campaignDraftId = draftCampaign.id;

    const memberUser = await createChoirUser('member', {
      familyId,
      familyRole: FamilyMemberRole.MEMBER,
    });
    memberToken = memberUser.token;
    memberId = memberUser.memberId;

    const headUser = await createChoirUser('head', {
      familyId,
      familyRole: FamilyMemberRole.HEAD,
    });
    headToken = headUser.token;

    const noFamily = await createChoirUser('nofamily');
    memberNoFamilyToken = noFamily.token;

    const noPhone = await createChoirUser('nophone', {
      familyId,
      familyRole: FamilyMemberRole.MEMBER,
      phone: null,
    });
    memberNoPhoneToken = noPhone.token;
  });

  afterAll(async () => {
    await app.close();
  });

  const validBody = () => ({
    contributionTypeCatalogId: catalogActiveId,
    claimedAmount: 10000,
    paymentAt: new Date().toISOString(),
    paymentChannel: PaymentChannel.MOMO,
    receiptUrl: null,
  });

  it('submits contribution successfully', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/finance/contributions/submit')
      .set('Authorization', `Bearer ${memberToken}`)
      .send(validBody())
      .expect(201);

    expect(res.body.data.status).toBe('SUBMITTED');
    expect(res.body.data.claimedAmount).toBe(10000);
    expect(res.body.data.confirmedAmount).toBeNull();
    expect(res.body.data.familyId).toBe(familyId);
    expect(res.body.data.memberId).toBe(memberId);
    expect(res.body.data.referenceNumber).toMatch(/^CNT-/);
  });

  it('rejects inactive contribution type', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/finance/contributions/submit')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ ...validBody(), contributionTypeCatalogId: catalogInactiveId })
      .expect(400);
  });

  it('rejects inactive campaign', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/finance/contributions/submit')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        ...validBody(),
        contributionCampaignId: campaignDraftId,
      })
      .expect(400);
  });

  it('accepts active campaign', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/finance/contributions/submit')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        ...validBody(),
        contributionCampaignId: campaignActiveId,
      })
      .expect(201);
  });

  it('rejects submit without family', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/finance/contributions/submit')
      .set('Authorization', `Bearer ${memberNoFamilyToken}`)
      .send(validBody())
      .expect(403);
  });

  it('rejects submit without phone', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/finance/contributions/submit')
      .set('Authorization', `Bearer ${memberNoPhoneToken}`)
      .send(validBody())
      .expect(403);
  });

  it('rejects invalid amount', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/finance/contributions/submit')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ ...validBody(), claimedAmount: 0 })
      .expect(400);
  });

  it('rejects future paymentAt beyond tolerance', async () => {
    const future = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    await request(app.getHttpServer())
      .post('/api/v1/finance/contributions/submit')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ ...validBody(), paymentAt: future })
      .expect(400);
  });

  it('ignores spoofed memberId and familyId', async () => {
    const otherFamily = await prisma.family.create({
      data: {
        familyCode: `FAM${Date.now()}X`,
        familyName: 'Other',
      },
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/finance/contributions/submit')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        ...validBody(),
        memberId: '00000000-0000-0000-0000-000000000099',
        familyId: otherFamily.id,
      })
      .expect(201);

    expect(res.body.data.memberId).toBe(memberId);
    expect(res.body.data.familyId).toBe(familyId);
    expect(res.body.data.familyId).not.toBe(otherFamily.id);
  });

  it('places submission in family inbox', async () => {
    const submit = await request(app.getHttpServer())
      .post('/api/v1/finance/contributions/submit')
      .set('Authorization', `Bearer ${memberToken}`)
      .send(validBody())
      .expect(201);

    const inbox = await request(app.getHttpServer())
      .get(`/api/v1/finance/contributions/family/inbox?familyId=${familyId}`)
      .set('Authorization', `Bearer ${headToken}`)
      .expect(200);

    const ids = (inbox.body.data.items as Array<{ id: string }>).map((i) => i.id);
    expect(ids).toContain(submit.body.data.id);
  });

  it('writes CONTRIBUTION_SUBMITTED audit record', async () => {
    const submit = await request(app.getHttpServer())
      .post('/api/v1/finance/contributions/submit')
      .set('Authorization', `Bearer ${memberToken}`)
      .send(validBody())
      .expect(201);

    const audit = await prisma.auditLog.findFirst({
      where: {
        action: 'CONTRIBUTION_SUBMITTED',
        entityId: submit.body.data.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(audit).toBeTruthy();
    const payload = audit!.newValue as Record<string, unknown>;
    expect(payload.memberId).toBe(memberId);
    expect(payload.familyId).toBe(familyId);
    expect(payload.catalogId).toBe(catalogActiveId);
    expect(payload.claimedAmount).toBe(10000);
    expect(payload.status).toBe('SUBMITTED');
  });
});
