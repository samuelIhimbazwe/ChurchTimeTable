import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { MemberStatus } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import {
  CHURCH_ADMIN_OPERATIONAL_PERMISSIONS,
  PERMISSIONS,
  ROLES,
} from '../src/common/constants/roles';
import { PrismaService } from '../src/prisma/prisma.service';
import { syncRolePermissions } from './helpers/e2e-app.util';

describe('Dashboard hardening (e2e)', () => {
  let app: INestApplication<App>;
  let readOnlyToken: string;
  let writeEventsToken: string;
  let reportExportToken: string;
  let churchAdminToken: string;

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
    const passwordHash = await bcrypt.hash('TestPass1', 10);
    const stamp = Date.now();

    async function createUser(
      email: string,
      roleName: string,
      permissionCodes: string[],
    ) {
      let role = await prisma.role.findUnique({ where: { name: roleName } });
      if (!role) {
        role = await prisma.role.create({
          data: { name: roleName, description: roleName },
        });
      }
      await syncRolePermissions(prisma, role.id, permissionCodes);
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          isActive: true,
          member: {
            create: {
              firstName: 'Dash',
              lastName: 'Test',
              ministry: 'BOTH',
              status: MemberStatus.ACTIVE,
              phone: `078${String(stamp).slice(-7)}`,
            },
          },
          userRoles: { create: { roleId: role.id } },
        },
      });
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'TestPass1' });
      return login.body.data.accessToken as string;
    }

    readOnlyToken = await createUser(
      `event-read-${stamp}@test.local`,
      `EVENT_READ_${stamp}`,
      [PERMISSIONS.EVENT_READ, PERMISSIONS.MEMBER_READ],
    );
    writeEventsToken = await createUser(
      `event-write-${stamp}@test.local`,
      `EVENT_WRITE_${stamp}`,
      [PERMISSIONS.EVENT_READ, PERMISSIONS.EVENT_WRITE, PERMISSIONS.MEMBER_READ],
    );
    reportExportToken = await createUser(
      `report-export-${stamp}@test.local`,
      `REPORT_EXPORT_${stamp}`,
      [PERMISSIONS.REPORT_EXPORT, PERMISSIONS.EVENT_READ],
    );

    let churchAdminRole = await prisma.role.findUnique({
      where: { name: ROLES.CHURCH_ADMIN },
    });
    if (!churchAdminRole) {
      churchAdminRole = await prisma.role.create({
        data: { name: ROLES.CHURCH_ADMIN, description: 'Church operations admin' },
      });
    }
    await syncRolePermissions(prisma, churchAdminRole.id, [
      ...CHURCH_ADMIN_OPERATIONAL_PERMISSIONS,
    ]);
    const churchEmail = `church-dash-${stamp}@test.local`;
    await prisma.user.create({
      data: {
        email: churchEmail,
        passwordHash,
        isActive: true,
        member: {
          create: {
            firstName: 'Church',
            lastName: 'Admin',
            ministry: 'BOTH',
            status: MemberStatus.ACTIVE,
            phone: `078${String(stamp + 1).slice(-7)}`,
          },
        },
        userRoles: { create: { roleId: churchAdminRole.id } },
      },
    });
    const churchLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: churchEmail, password: 'TestPass1' });
    churchAdminToken = churchLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('denies leader-summary for event:read only and report:export only actors', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/dashboard/leader-summary')
      .set('Authorization', `Bearer ${readOnlyToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/dashboard/leader-summary')
      .set('Authorization', `Bearer ${reportExportToken}`)
      .expect(403);
  });

  it('allows leader-summary for event:write and CHURCH_ADMIN actors', async () => {
    const writeRes = await request(app.getHttpServer())
      .get('/api/v1/dashboard/leader-summary')
      .set('Authorization', `Bearer ${writeEventsToken}`)
      .expect(200);
    expect(writeRes.body.success).toBe(true);

    const churchRes = await request(app.getHttpServer())
      .get('/api/v1/dashboard/leader-summary')
      .set('Authorization', `Bearer ${churchAdminToken}`)
      .expect(200);
    expect(churchRes.body.success).toBe(true);
    expect(churchRes.body.data.recentAudit).toBeUndefined();
    expect(
      (churchRes.body.data.widgets ?? []).some(
        (w: { id: string }) => w.id === 'auditActivity',
      ),
    ).toBe(false);
  });

  it('hides finance widgets for actors without finance intelligence claims', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/dashboard/leader-summary')
      .set('Authorization', `Bearer ${writeEventsToken}`)
      .expect(200);

    expect(res.body.data.financeSummary).toBeUndefined();
    expect(
      (res.body.data.widgets ?? []).some((w: { id: string }) =>
        ['financeSnapshot', 'financeStewardshipPanel', 'treasurerPanel'].includes(w.id),
      ),
    ).toBe(false);
  });
});
