import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  CHOIR_OFFICER_META,
  roleDescription,
} from '../src/common/constants/choir-officer-meta';
import {
  CHOIR_OPERATIONS_PERMS,
  PERMISSIONS,
  ROLES,
} from '../src/common/constants/roles';
import {
  DEFAULT_PHONE_ENFORCEMENT,
  PHONE_ENFORCEMENT_ENABLED_KEY,
  PHONE_ENFORCEMENT_MODE_KEY,
} from '../src/common/member/phone-enforcement.constants';

const prisma = new PrismaClient();

/**
 * Choir officer permission matrix (customize per church).
 * See docs/pilot/CHOIR_OFFICER_ROLES.md
 */
const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  [ROLES.MEMBER]: [PERMISSIONS.EVENT_READ],

  [ROLES.CHOIR_LEADER]: [
    ...CHOIR_OPERATIONS_PERMS,
    PERMISSIONS.FINANCE_WRITE,
  ],

  // Perezida — full choir authority + finance
  [ROLES.CHOIR_PRESIDENT]: [
    ...CHOIR_OPERATIONS_PERMS,
    PERMISSIONS.FINANCE_WRITE,
    PERMISSIONS.MEMBER_MANAGE,
  ],

  // Perezida ushinzwe — operations; read finance; no member status changes
  [ROLES.CHOIR_VICE_PRESIDENT]: [
    ...CHOIR_OPERATIONS_PERMS,
    PERMISSIONS.FINANCE_READ,
  ],

  // Umunyamabanga — schedule, roster, attendance, swaps; no finance write; no discipline decisions
  [ROLES.CHOIR_SECRETARY]: [
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.EVENT_WRITE,
    PERMISSIONS.ASSIGNMENT_WRITE,
    PERMISSIONS.MEMBER_READ,
    PERMISSIONS.ATTENDANCE_WRITE,
    PERMISSIONS.SWAP_MANAGE,
    PERMISSIONS.DISCIPLINE_READ_ALL,
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.REPORT_EXPORT,
  ],

  // Umubitsi — finance only (+ view calendar for context)
  [ROLES.CHOIR_TREASURER]: [
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.FINANCE_WRITE,
    PERMISSIONS.CHOIR_FINANCE_VIEW,
    PERMISSIONS.CHOIR_FINANCE_MANAGE,
    PERMISSIONS.CHOIR_FINANCE_APPROVE,
    PERMISSIONS.REPORT_EXPORT,
  ],

  // Imyitozo — assignments & attendance; no swaps approval, no finance, no discipline
  [ROLES.CHOIR_REHEARSAL_DIRECTOR]: [
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.ASSIGNMENT_WRITE,
    PERMISSIONS.MEMBER_READ,
    PERMISSIONS.ATTENDANCE_WRITE,
    PERMISSIONS.REPORT_EXPORT,
  ],

  // Ibikoresho / uniform — roster support; no finance, no event create
  [ROLES.CHOIR_LOGISTICS]: [
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.ASSIGNMENT_WRITE,
    PERMISSIONS.MEMBER_READ,
    PERMISSIONS.ATTENDANCE_WRITE,
    PERMISSIONS.REPORT_EXPORT,
  ],

  // Inteko — oversight read-only
  [ROLES.CHOIR_COMMITTEE]: [
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.REPORT_EXPORT,
  ],

  [ROLES.PROTOCOL_LEADER]: [
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.EVENT_WRITE,
    PERMISSIONS.ASSIGNMENT_WRITE,
    PERMISSIONS.MEMBER_READ,
    PERMISSIONS.ATTENDANCE_WRITE,
    PERMISSIONS.PROTOCOL_ATTENDANCE_MANAGE,
    PERMISSIONS.SWAP_MANAGE,
    PERMISSIONS.DISCIPLINE_READ_ALL,
    PERMISSIONS.DISCIPLINE_MANAGE,
    PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,
  ],

  [ROLES.CHURCH_ADMIN]: Object.values(PERMISSIONS).filter(
    (p) => p !== PERMISSIONS.SYNC_ADMIN,
  ),
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
};

const DEFAULT_CHOIR_COMMITTEE_ROLES = [
  { name: 'choir_leader', permissions: [PERMISSIONS.CHOIR_EVENTS_MANAGE_SCOPE, PERMISSIONS.ATTENDANCE_MARK_SCOPE] },
  { name: 'vice_leader', permissions: [PERMISSIONS.CHOIR_EVENTS_MANAGE_SCOPE] },
  { name: 'secretary', permissions: [PERMISSIONS.EVENT_WRITE, PERMISSIONS.ATTENDANCE_MARK_SCOPE] },
  { name: 'treasurer', permissions: [PERMISSIONS.FINANCE_VIEW_SCOPE, PERMISSIONS.FINANCE_WRITE] },
  { name: 'discipline_leader', permissions: [PERMISSIONS.DISCIPLINE_REVIEW_SCOPE] },
  { name: 'organizer', permissions: [PERMISSIONS.CHOIR_EVENTS_MANAGE_SCOPE] },
  { name: 'social_outreach', permissions: [PERMISSIONS.REPORT_EXPORT] },
  { name: 'operations_manager', permissions: [PERMISSIONS.CHOIR_EVENTS_MANAGE_SCOPE, PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE] },
];

const DEFAULT_PROTOCOL_COMMITTEE_ROLES = [
  {
    name: 'protocol_president',
    permissions: [
      PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,
      PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,
      PERMISSIONS.PROTOCOL_FINANCE_VIEW,
    ],
  },
  {
    name: 'protocol_secretary',
    permissions: [PERMISSIONS.EVENT_WRITE, PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR],
  },
  {
    name: 'protocol_coordinator',
    permissions: [
      PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,
      PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,
      PERMISSIONS.PROTOCOL_ATTENDANCE_MANAGE,
      PERMISSIONS.ATTENDANCE_MARK_SCOPE,
    ],
  },
  {
    name: 'protocol_team_head',
    permissions: [
      PERMISSIONS.PROTOCOL_TEAM_HEAD,
      PERMISSIONS.PROTOCOL_ATTENDANCE_MANAGE,
      PERMISSIONS.ATTENDANCE_MARK_SCOPE,
    ],
  },
  {
    name: 'protocol_treasurer',
    permissions: [
      PERMISSIONS.PROTOCOL_FINANCE_VIEW,
      PERMISSIONS.PROTOCOL_FINANCE_MANAGE,
      PERMISSIONS.PROTOCOL_FINANCE_APPROVE,
    ],
  },
];

async function main() {
  const permByCode: Record<string, string> = {};
  for (const code of Object.values(PERMISSIONS)) {
    const permission = await prisma.permission.upsert({
      where: { code },
      create: { code, description: code },
      update: {},
    });
    permByCode[code] = permission.id;
  }

  for (const [roleName, perms] of Object.entries(ROLE_PERMISSION_MAP)) {
    const description = roleDescription(roleName);
    const role = await prisma.role.upsert({
      where: { name: roleName },
      create: { name: roleName, description },
      update: { description },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    for (const perm of [...new Set(perms)]) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permByCode[perm],
          },
        },
        create: { roleId: role.id, permissionId: permByCode[perm] },
        update: {},
      });
    }
  }

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: ROLES.SUPER_ADMIN },
  });

  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@church.local' },
    create: {
      email: 'admin@church.local',
      passwordHash,
      member: {
        create: {
          firstName: 'System',
          lastName: 'Admin',
          ministry: 'BOTH',
          status: 'ACTIVE',
        },
      },
      userRoles: { create: { roleId: adminRole.id } },
    },
    update: {},
    include: { member: true },
  });

  const defaultChoirScope = 'default-choir';
  for (const role of DEFAULT_CHOIR_COMMITTEE_ROLES) {
    await (prisma as any).choirCommitteeRole.upsert({
      where: {
        choirId_name: {
          choirId: defaultChoirScope,
          name: role.name,
        },
      },
      create: {
        choirId: defaultChoirScope,
        name: role.name,
        permissionsJson: role.permissions,
      },
      update: {
        permissionsJson: role.permissions,
      },
    });
  }

  const defaultProtocolScope = 'protocol-ministry';
  for (const role of DEFAULT_PROTOCOL_COMMITTEE_ROLES) {
    await (prisma as any).protocolCommitteeRole.upsert({
      where: {
        ministryId_name: {
          ministryId: defaultProtocolScope,
          name: role.name,
        },
      },
      create: {
        ministryId: defaultProtocolScope,
        name: role.name,
        permissionsJson: role.permissions,
      },
      update: {
        permissionsJson: role.permissions,
      },
    });
  }

  console.log('Seed complete. Admin:', admin.email, '/ Admin@123');
  console.log(
    'Choir officer roles:',
    Object.keys(CHOIR_OFFICER_META).join(', '),
  );

  await prisma.systemSetting.upsert({
    where: { key: PHONE_ENFORCEMENT_ENABLED_KEY },
    create: {
      key: PHONE_ENFORCEMENT_ENABLED_KEY,
      value: DEFAULT_PHONE_ENFORCEMENT.enabled,
    },
    update: { value: DEFAULT_PHONE_ENFORCEMENT.enabled },
  });

  await prisma.systemSetting.upsert({
    where: { key: PHONE_ENFORCEMENT_MODE_KEY },
    create: {
      key: PHONE_ENFORCEMENT_MODE_KEY,
      value: DEFAULT_PHONE_ENFORCEMENT.mode,
    },
    update: { value: DEFAULT_PHONE_ENFORCEMENT.mode },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
