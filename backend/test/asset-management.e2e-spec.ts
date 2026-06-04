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
import { CHURCH_OWNER_ID } from '../src/assets/assets.constants';

describe('Asset Management MF-4 (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let musicMinistryId: string;
  let youthMinistryId: string;
  let categoryId: string;
  let assetId: string;

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

    const category = await prisma.assetCategory.findUniqueOrThrow({
      where: { code: 'MUSICAL_INSTRUMENT' },
    });
    categoryId = category.id;

    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLES.SUPER_ADMIN },
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

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: `mf4-admin-${ts}@test.local`, password: 'TestPass1' });
    adminToken = login.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists system categories', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/assets/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.data.some((c: { code: string }) => c.code === 'AUDIO')).toBe(
      true,
    );
  });

  it('creates asset with instrument profile', async () => {
    const code = `KB-MF4-${Date.now()}`;
    const res = await request(app.getHttpServer())
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code,
        name: 'Test Keyboard',
        categoryId,
        instrumentProfile: { instrumentType: 'Keyboard' },
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    assetId = res.body.data.id;
    expect(res.body.data.code).toBe(code);
  });

  it('adds shared ownership totaling 100%', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/assets/${assetId}/ownership`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ownerType: 'MINISTRY',
        ownerId: musicMinistryId,
        ownershipPercentage: 50,
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    await request(app.getHttpServer())
      .post(`/api/v1/assets/${assetId}/ownership`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ownerType: 'MINISTRY',
        ownerId: youthMinistryId,
        ownershipPercentage: 50,
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const validate = await request(app.getHttpServer())
      .get(`/api/v1/assets/${assetId}/ownership/validate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(validate.body.data.valid).toBe(true);
  });

  it('assigns asset to ministry', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/assets/${assetId}/assignments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assignedToType: 'MINISTRY',
        assignedToId: youthMinistryId,
        purpose: 'Youth conference',
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });
    expect(res.body.data.assignedToId).toBe(youthMinistryId);
  });

  it('records maintenance', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/assets/${assetId}/maintenance`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'SERVICE',
        description: 'Annual service',
        nextMaintenanceDate: new Date(Date.now() + 86400000 * 365).toISOString(),
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });
  });

  it('returns inventory report', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/assets/reports/inventory')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.data.total).toBeGreaterThan(0);
  });

  it('church ownership constant is stable', () => {
    expect(CHURCH_OWNER_ID).toBe('CHURCH');
  });
});
