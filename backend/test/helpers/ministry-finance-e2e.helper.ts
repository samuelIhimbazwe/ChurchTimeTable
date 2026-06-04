import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { MemberStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';
import { ROLES } from '../../src/common/constants/roles';
import { PrismaService } from '../../src/prisma/prisma.service';

export type MinistryFinanceE2eContext = {
  app: INestApplication<App>;
  prisma: PrismaService;
  adminToken: string;
  musicMinistryId: string;
  fundId: string;
  budgetId: string;
  categoryId: string;
  expenseId: string;
};

export async function bootstrapMinistryFinanceE2e(): Promise<MinistryFinanceE2eContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
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

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: ROLES.SUPER_ADMIN },
  });
  const passwordHash = await bcrypt.hash('TestPass1', 10);
  const ts = Date.now();

  await prisma.user.create({
    data: {
      email: `mf5-admin-${ts}@test.local`,
      passwordHash,
      isActive: true,
      member: {
        create: {
          firstName: 'MF5',
          lastName: 'Admin',
          ministry: 'BOTH',
          status: MemberStatus.ACTIVE,
          phone: `0794${String(ts).slice(-6)}`,
        },
      },
      userRoles: { create: { roleId: adminRole.id } },
    },
  });

  const login = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: `mf5-admin-${ts}@test.local`, password: 'TestPass1' });

  const adminToken = login.body.data.accessToken;
  const ctx = {
    app,
    prisma,
    adminToken,
    musicMinistryId: music.id,
    fundId: '',
    budgetId: '',
    categoryId: '',
    expenseId: '',
  };

  const fundRes = await request(app.getHttpServer())
    .post(`/api/v1/ministries/${music.id}/finance/funds`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `General-${ts}`, type: 'GENERAL' });
  ctx.fundId = fundRes.body.data.id;

  await request(app.getHttpServer())
    .post(`/api/v1/ministries/${music.id}/finance/funds/${ctx.fundId}/deposits`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ amount: 500000, description: 'Seed deposit' });

  const budgetRes = await request(app.getHttpServer())
    .post(`/api/v1/ministries/${music.id}/finance/budgets`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: `FY-${ts}`,
      fiscalYear: new Date().getFullYear(),
      totalBudget: 1000000,
      categories: [{ name: 'Equipment', allocatedAmount: 400000 }],
    });
  ctx.budgetId = budgetRes.body.data.id;
  ctx.categoryId = budgetRes.body.data.categories[0].id;

  return ctx;
}
