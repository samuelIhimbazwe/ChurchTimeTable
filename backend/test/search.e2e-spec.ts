import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import {
  ContributionStatus,
  ContributionType,
  EventType,
  MemberStatus,
} from '@prisma/client';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { ROLES, PERMISSIONS } from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Search (e2e)', () => {
  let app: INestApplication<App>;
  let leaderToken: string;
  let memberToken: string;
  let hiddenMemberId: string;
  let visibleMemberId: string;
  let contributionRef: string;

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
    const presidentRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.CHOIR_PRESIDENT },
    });

    for (const code of [
      PERMISSIONS.MEMBER_READ,
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.MEMBER_MANAGE,
      PERMISSIONS.CHOIR_FINANCE_VIEW,
      PERMISSIONS.CHOIR_FINANCE_MANAGE,
    ]) {
      const permission = await prisma.permission.upsert({
        where: { code },
        create: { code, description: code },
        update: {},
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: presidentRole.id,
            permissionId: permission.id,
          },
        },
        create: { roleId: presidentRole.id, permissionId: permission.id },
        update: {},
      });
    }

    const leaderEmail = `search-leader-${Date.now()}@test.local`;
    const memberEmail = `search-member-${Date.now()}@test.local`;
    const passwordHash = await bcrypt.hash('TestPass1', 10);

    await prisma.user.create({
      data: {
        email: leaderEmail,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Search',
            lastName: 'Leader',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234580',
          },
        },
        userRoles: { create: { roleId: presidentRole.id } },
      },
    });

    const memberUser = await prisma.user.create({
      data: {
        email: memberEmail,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Search',
            lastName: 'Member',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
            phone: '0781234581',
          },
        },
        userRoles: { create: { roleId: memberRole.id } },
      },
      include: { member: true },
    });
    visibleMemberId = memberUser.member!.id;

    const hiddenMember = await prisma.member.create({
      data: {
        firstName: 'Hidden',
        lastName: 'ProtocolOnly',
        ministry: 'PROTOCOL',
        status: MemberStatus.ACTIVE,
        phone: '0781234582',
        user: {
          create: {
            email: `hidden-protocol-${Date.now()}@test.local`,
            passwordHash,
            isActive: true,
            userRoles: { create: { roleId: memberRole.id } },
          },
        },
      },
    });
    hiddenMemberId = hiddenMember.id;

    await prisma.event.create({
      data: {
        title: 'Searchable Choir Rehearsal',
        type: EventType.REHEARSAL,
        ministryScope: 'CHOIR',
        startTime: new Date(Date.now() + 86400000),
        endTime: new Date(Date.now() + 90000000),
      },
    });

    contributionRef = `SRCH-${Date.now()}`;
    await prisma.contributionRecord.create({
      data: {
        memberId: visibleMemberId,
        contributionType: ContributionType.OTHER,
        amount: 500,
        status: ContributionStatus.CONFIRMED,
        referenceNumber: contributionRef,
      },
    });

    const leaderLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: leaderEmail, password: 'TestPass1' });
    leaderToken = leaderLogin.body.data.accessToken;

    const memberLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: memberEmail, password: 'TestPass1' });
    memberToken = memberLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('member without roster permissions receives no member results', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/search?q=Search')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    expect(res.body.data.members).toEqual([]);
  });

  it('leader search returns scoped members without private contact fields', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/search?q=Search')
      .set('Authorization', `Bearer ${leaderToken}`)
      .expect(200);

    expect(res.body.data.members.length).toBeGreaterThan(0);
    for (const row of res.body.data.members) {
      expect(row).toEqual(
        expect.objectContaining({
          type: 'member',
          id: expect.any(String),
          displayName: expect.any(String),
        }),
      );
      expect(row.email).toBeUndefined();
      expect(row.phone).toBeUndefined();
    }
    expect(
      res.body.data.members.some(
        (row: { id: string }) => row.id === hiddenMemberId,
      ),
    ).toBe(false);
  });

  it('leader can search events and suggestions stay capped', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/search/suggestions?q=Searchable')
      .set('Authorization', `Bearer ${leaderToken}`)
      .expect(200);

    expect(res.body.data.events.length).toBeGreaterThan(0);
    const total =
      res.body.data.members.length +
      res.body.data.families.length +
      res.body.data.events.length +
      res.body.data.assignments.length +
      res.body.data.contributions.length;
    expect(total).toBeLessThanOrEqual(10);
  });

  it('finance contribution matches are reference-only for finance leaders', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/search?q=${contributionRef}`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .expect(200);

    expect(res.body.data.contributions).toEqual([
      expect.objectContaining({
        type: 'contribution',
        referenceNumber: contributionRef,
      }),
    ]);
    expect(res.body.data.contributions[0].amount).toBeUndefined();
  });
});
