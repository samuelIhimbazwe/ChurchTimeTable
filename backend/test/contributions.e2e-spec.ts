import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { ContributionType, MemberStatus } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { ROLES } from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Contributions (e2e)', () => {
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

    const memberEmail = `contrib-member-${Date.now()}@test.local`;
    const treasurerEmail = `contrib-treasurer-${Date.now()}@test.local`;
    const passwordHash = await bcrypt.hash('TestPass1', 10);

    const memberUser = await prisma.user.create({
      data: {
        email: memberEmail,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Contrib',
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
            firstName: 'Contrib',
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

  it('member can access my-contributions endpoints', async () => {
    const full = await request(app.getHttpServer())
      .get('/api/v1/finance/my-contributions')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    expect(full.body.data.memberNumber).toBeDefined();
    expect(full.body.data.contributionRecords).toBeDefined();

    const summary = await request(app.getHttpServer())
      .get('/api/v1/finance/my-contributions/summary')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    expect(summary.body.data.totals).toBeDefined();
    expect(summary.body.data.byType).toBeDefined();
  });

  it('treasurer can create, submit, and confirm contribution flow', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/finance/contributions')
      .set('Authorization', `Bearer ${treasurerToken}`)
      .send({
        memberId,
        contributionType: ContributionType.TITHE,
        amount: 2500,
      })
      .expect(201);

    contributionId = created.body.data.id;
    expect(created.body.data.status).toBe('PENDING');

    await request(app.getHttpServer())
      .post(`/api/v1/finance/contributions/${contributionId}/submit`)
      .set('Authorization', `Bearer ${treasurerToken}`)
      .expect(201);

    const confirmed = await request(app.getHttpServer())
      .post(`/api/v1/finance/contributions/${contributionId}/confirm`)
      .set('Authorization', `Bearer ${treasurerToken}`)
      .expect(201);

    expect(confirmed.body.data.status).toBe('CONFIRMED');
    expect(confirmed.body.data.financeTransactionId).toBeTruthy();
  });

  it('stewardship analytics includes contribution metrics for treasurer', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/finance/stewardship/analytics')
      .set('Authorization', `Bearer ${treasurerToken}`)
      .expect(200);

    expect(res.body.data.contributions).toBeDefined();
    expect(res.body.data.contributions.contributionTotals).toBeGreaterThan(0);
  });

  it('member cannot access contribution confirmation queue', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/finance/contributions/queue')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });

  it('legacy contributions/mine route remains available', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/finance/contributions/mine')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
  });
});
