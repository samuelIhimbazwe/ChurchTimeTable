import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import {
  ContributionCampaignStatus,
  ContributionStatus,
  ContributionType,
  FamilyMemberRole,
  MemberStatus,
  PaymentChannel,
} from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { PERMISSIONS, ROLES } from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Sprint 10.2.7 — governance corrections (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let familyAId: string;
  let familyBId: string;
  let catalogAId: string;
  let catalogBId: string;
  let campaign2027Id: string;
  let campaign2028Id: string;

  let headToken: string;
  let treasurerToken: string;
  let memberId: string;
  let confirmedId: string;

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

    const grant = async (roleName: string, perms: string[]) => {
      const role = await prisma.role.upsert({
        where: { name: roleName },
        create: { name: roleName, description: roleName },
        update: {},
      });
      await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
      for (const code of [...new Set(perms)]) {
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
    };

    await grant(ROLES.MEMBER, [PERMISSIONS.CHOIR_CONTRIBUTION_SUBMIT]);
    await grant(ROLES.CHOIR_TREASURER, [
      PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
    ]);

    familyAId = (
      await prisma.family.create({
        data: {
          familyCode: `FAM107A${Date.now()}`,
          familyName: 'Correction A',
        },
      })
    ).id;
    familyBId = (
      await prisma.family.create({
        data: {
          familyCode: `FAM107B${Date.now()}`,
          familyName: 'Correction B',
        },
      })
    ).id;

    catalogAId = (
      await prisma.contributionTypeCatalog.create({
        data: {
          code: `uniform_${Date.now()}`,
          name: 'Uniform',
          active: true,
          ministryScope: 'CHOIR',
        },
      })
    ).id;
    catalogBId = (
      await prisma.contributionTypeCatalog.create({
        data: {
          code: `concert_${Date.now()}`,
          name: 'Concert',
          active: true,
          ministryScope: 'CHOIR',
        },
      })
    ).id;

    campaign2027Id = (
      await prisma.contributionCampaign.create({
        data: {
          contributionTypeId: catalogBId,
          name: 'Concert 2027',
          goalAmount: 50000,
          status: ContributionCampaignStatus.ACTIVE,
          ministryScope: 'CHOIR',
        },
      })
    ).id;
    campaign2028Id = (
      await prisma.contributionCampaign.create({
        data: {
          contributionTypeId: catalogBId,
          name: 'Concert 2028',
          goalAmount: 60000,
          status: ContributionCampaignStatus.ACTIVE,
          ministryScope: 'CHOIR',
        },
      })
    ).id;

    const mkUser = async (label: string, role: string, familyRole?: FamilyMemberRole) => {
      const r = await prisma.role.findUniqueOrThrow({ where: { name: role } });
      const email = `s107-${label}-${Date.now()}@test.local`;
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: await bcrypt.hash('TestPass1', 10),
          isActive: true,
          member: {
            create: {
              firstName: label,
              lastName: 'Corr',
              ministry: 'CHOIR',
              status: MemberStatus.ACTIVE,
              phone: '0781234567',
            },
          },
          userRoles: { create: { roleId: r.id } },
        },
        include: { member: true },
      });
      if (familyRole) {
        await prisma.familyMember.create({
          data: { familyId: familyAId, memberId: user.member!.id, role: familyRole },
        });
        if (familyRole === FamilyMemberRole.HEAD) {
          await prisma.family.update({
            where: { id: familyAId },
            data: { headMemberId: user.member!.id },
          });
        }
      }
      return {
        token: await jwtService.signAsync({ sub: user.id, email }),
        memberId: user.member!.id,
      };
    };

    const member = await mkUser('mem', ROLES.MEMBER, FamilyMemberRole.MEMBER);
    memberId = member.memberId;
    headToken = (await mkUser('head', ROLES.MEMBER, FamilyMemberRole.HEAD)).token;
    treasurerToken = (await mkUser('treas', ROLES.CHOIR_TREASURER)).token;

    const row = await prisma.contributionRecord.create({
      data: {
        memberId,
        familyId: familyAId,
        contributionType: ContributionType.OFFERING,
        contributionTypeCatalogId: catalogAId,
        contributionCampaignId: campaign2027Id,
        amount: 10000,
        claimedAmount: 10000,
        confirmedAmount: 10000,
        status: ContributionStatus.CONFIRMED,
        referenceNumber: `CNT-107-${Date.now()}`,
        paymentAt: new Date(),
        paymentChannel: PaymentChannel.MOMO,
        confirmedAt: new Date(),
        familyApprovedAt: new Date(),
      },
    });
    confirmedId = row.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('change-family updates record and audits', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/finance/contributions/${confirmedId}/change-family`)
      .set('Authorization', `Bearer ${treasurerToken}`)
      .send({ newFamilyId: familyBId, reason: 'Misassigned family at intake' })
      .expect(201);

    expect(res.body.data.familyId).toBe(familyBId);

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'CONTRIBUTION_FAMILY_CHANGE', entityId: confirmedId },
    });
    expect(audit).toBeTruthy();
    const payload = audit!.newValue as Record<string, unknown>;
    expect(payload.oldFamilyId).toBe(familyAId);
    expect(payload.newFamilyId).toBe(familyBId);
  });

  it('change-type updates catalog and audits', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/finance/contributions/${confirmedId}/change-type`)
      .set('Authorization', `Bearer ${treasurerToken}`)
      .send({
        contributionTypeCatalogId: catalogBId,
        reason: 'Should have been concert type',
      })
      .expect(201);

    expect(res.body.data.contributionTypeCatalogId).toBe(catalogBId);

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'CONTRIBUTION_TYPE_CHANGE', entityId: confirmedId },
    });
    expect(audit).toBeTruthy();
  });

  it('change-campaign updates campaign and audits', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/finance/contributions/${confirmedId}/change-campaign`)
      .set('Authorization', `Bearer ${treasurerToken}`)
      .send({
        contributionCampaignId: campaign2028Id,
        reason: 'Wrong concert year selected',
      })
      .expect(201);

    expect(res.body.data.contributionCampaignId).toBe(campaign2028Id);

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'CONTRIBUTION_CAMPAIGN_CHANGE', entityId: confirmedId },
    });
    expect(audit).toBeTruthy();
  });

  it('timeline returns chronological governance events', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/finance/contributions/${confirmedId}/timeline`)
      .set('Authorization', `Bearer ${treasurerToken}`)
      .expect(200);

    const types = res.body.data.events.map((e: { type: string }) => e.type);
    expect(types).toContain('family_changed');
    expect(types).toContain('type_changed');
    expect(types).toContain('campaign_changed');

    for (let i = 1; i < res.body.data.events.length; i++) {
      const prev = new Date(res.body.data.events[i - 1].timestamp).getTime();
      const cur = new Date(res.body.data.events[i].timestamp).getTime();
      expect(cur).toBeGreaterThanOrEqual(prev);
    }
  });

  it('head cannot change family on other family record without global adjust', async () => {
    const other = await prisma.contributionRecord.create({
      data: {
        memberId,
        familyId: familyBId,
        contributionType: ContributionType.OFFERING,
        contributionTypeCatalogId: catalogAId,
        amount: 5000,
        claimedAmount: 5000,
        confirmedAmount: 5000,
        status: ContributionStatus.CONFIRMED,
        referenceNumber: `CNT-107-OTHER-${Date.now()}`,
        paymentAt: new Date(),
        paymentChannel: PaymentChannel.MOMO,
        confirmedAt: new Date(),
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/finance/contributions/${other.id}/change-family`)
      .set('Authorization', `Bearer ${headToken}`)
      .send({ newFamilyId: familyAId, reason: 'Should not allow cross family' })
      .expect(403);
  });
});
