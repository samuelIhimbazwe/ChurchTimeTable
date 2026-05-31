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

describe('Dashboard visibility (e2e)', () => {
  let app: INestApplication<App>;
  let rehearsalToken: string;

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
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.CHOIR_REHEARSAL_DIRECTOR },
    });
    const email = `rehearsal-${Date.now()}@visibility.test`;
    const passwordHash = await bcrypt.hash('TestPass1', 10);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Rehearsal',
            lastName: 'Director',
            ministry: 'CHOIR',
            status: MemberStatus.ACTIVE,
          },
        },
        userRoles: { create: { roleId: role.id } },
      },
    });

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPass1' });

    rehearsalToken = login.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('leader summary omits finance and discipline for rehearsal director', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/dashboard/leader-summary')
      .set('Authorization', `Bearer ${rehearsalToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.financeSummary).toBeUndefined();
    expect(res.body.data.activeDiscipline).toBeUndefined();
    expect(res.body.data.intelligence?.financeAnalytics).toBeUndefined();
    expect(res.body.data.intelligence?.disciplineAnalytics).toBeUndefined();
    expect(
      (res.body.data.alerts ?? []).some(
        (a: { type: string }) => a.type === 'finance_compliance',
      ),
    ).toBe(false);
    expect(
      (res.body.data.alerts ?? []).some(
        (a: { type: string }) => a.type === 'discipline_review',
      ),
    ).toBe(false);
  });
});
