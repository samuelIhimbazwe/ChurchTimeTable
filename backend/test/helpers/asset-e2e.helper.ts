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

export type AssetE2eContext = {
  app: INestApplication<App>;
  prisma: PrismaService;
  adminToken: string;
  memberToken: string;
  musicMinistryId: string;
  youthMinistryId: string;
  categoryId: string;
  memberId: string;
};

export async function bootstrapAssetE2e(): Promise<AssetE2eContext> {
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
  const youth = await prisma.ministry.findUniqueOrThrow({
    where: { code: 'YOUTH' },
  });
  const category = await prisma.assetCategory.findUniqueOrThrow({
    where: { code: 'MUSICAL_INSTRUMENT' },
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
      email: `mf4-admin-${ts}@test.local`,
      passwordHash,
      isActive: true,
      member: {
        create: {
          firstName: 'MF4',
          lastName: 'Admin',
          ministry: 'BOTH',
          status: MemberStatus.ACTIVE,
          phone: `0792${String(ts).slice(-6)}`,
        },
      },
      userRoles: { create: { roleId: adminRole.id } },
    },
  });

  const memberUser = await prisma.user.create({
    data: {
      email: `mf4-member-${ts}@test.local`,
      passwordHash,
      isActive: true,
      member: {
        create: {
          firstName: 'MF4',
          lastName: 'Member',
          ministry: 'CHOIR',
          status: MemberStatus.ACTIVE,
          phone: `0793${String(ts).slice(-6)}`,
        },
      },
      userRoles: { create: { roleId: memberRole.id } },
    },
    include: { member: true },
  });

  await prisma.ministryMembership.create({
    data: {
      ministryId: music.id,
      memberId: memberUser.member!.id,
      status: 'ACTIVE',
    },
  });

  const adminLogin = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: `mf4-admin-${ts}@test.local`, password: 'TestPass1' });

  const memberLogin = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: `mf4-member-${ts}@test.local`, password: 'TestPass1' });

  return {
    app,
    prisma,
    adminToken: adminLogin.body.data.accessToken,
    memberToken: memberLogin.body.data.accessToken,
    musicMinistryId: music.id,
    youthMinistryId: youth.id,
    categoryId: category.id,
    memberId: memberUser.member!.id,
  };
}

export async function createTestAsset(
  ctx: AssetE2eContext,
  suffix: string,
) {
  const code = `AST-${suffix}-${Date.now()}`;
  const res = await request(ctx.app.getHttpServer())
    .post('/api/v1/assets')
    .set('Authorization', `Bearer ${ctx.adminToken}`)
    .send({
      code,
      name: `Asset ${suffix}`,
      categoryId: ctx.categoryId,
    })
    .expect((res) => {
      expect([200, 201]).toContain(res.status);
    });
  return res.body.data.id as string;
}
