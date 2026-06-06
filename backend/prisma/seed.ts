import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  CHOIR_OFFICER_META,
  roleDescription,
} from '../src/common/constants/choir-officer-meta';
import {
  CHOIR_OPERATIONS_PERMS,
  CHURCH_ADMIN_OPERATIONAL_PERMISSIONS,
  PERMISSIONS,
  PROTOCOL_ADMIN_PERMISSIONS,
  ROLES,
} from '../src/common/constants/roles';
import {
  DEFAULT_PHONE_ENFORCEMENT,
  PHONE_ENFORCEMENT_ENABLED_KEY,
  PHONE_ENFORCEMENT_MODE_KEY,
} from '../src/common/member/phone-enforcement.constants';
import {
  MAIN_CHOIR_CODE,
  MAIN_CHOIR_ID,
} from '../src/common/constants/choir.constants';
import {
  DEFAULT_MINISTRIES,
  leadershipPositionsForMinistry,
} from '../src/ministries/ministry.constants';
import {
  DEFAULT_LEADERSHIP_POSITIONS as DEFAULT_UNIT_POSITIONS,
  DEFAULT_OPERATIONAL_UNITS,
} from '../src/operational-units/operational-unit.constants';

const prisma = new PrismaClient();

/**
 * Choir officer permission matrix (customize per church).
 * See docs/pilot/CHOIR_OFFICER_ROLES.md
 */
const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  [ROLES.MEMBER]: [
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.MEMBER_PORTAL_VIEW,
    PERMISSIONS.CHOIR_CONTRIBUTION_SUBMIT,
    PERMISSIONS.CHOIR_WELFARE_VIEW,
    PERMISSIONS.CHOIR_MUSIC_VIEW,
    PERMISSIONS.CHOIR_REHEARSAL_VIEW,
    PERMISSIONS.CHOIR_DEVOTION_VIEW,
  ],

  [ROLES.CHOIR_LEADER]: [
    ...CHOIR_OPERATIONS_PERMS,
    PERMISSIONS.CHOIR_FINANCE_MANAGE,
    PERMISSIONS.CHOIR_FINANCE_APPROVE,
  ],

  [ROLES.CHOIR_ADMIN]: [
    ...CHOIR_OPERATIONS_PERMS,
    PERMISSIONS.CHOIR_FINANCE_VIEW,
    PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
    PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
    PERMISSIONS.MEMBER_MANAGE,
    PERMISSIONS.CHOIR_WELFARE_VIEW,
    PERMISSIONS.CHOIR_WELFARE_MANAGE,
    PERMISSIONS.CHOIR_MUSIC_VIEW,
    PERMISSIONS.CHOIR_MUSIC_MANAGE,
    PERMISSIONS.CHOIR_REHEARSAL_VIEW,
    PERMISSIONS.CHOIR_REHEARSAL_MANAGE,
    PERMISSIONS.CHOIR_ANNOUNCEMENT_MANAGE,
    PERMISSIONS.CHOIR_DOCUMENT_MANAGE,
    PERMISSIONS.CHOIR_MEETING_MANAGE,
    PERMISSIONS.CHOIR_UNIFORM_MANAGE,
    PERMISSIONS.CHOIR_EQUIPMENT_MANAGE,
    PERMISSIONS.ASSET_VIEW,
    PERMISSIONS.ASSET_CREATE,
    PERMISSIONS.ASSET_MANAGE,
    PERMISSIONS.ASSET_ASSIGN,
    PERMISSIONS.ASSET_MAINTAIN,
    PERMISSIONS.ASSET_REPORT,
    PERMISSIONS.ASSET_OWNERSHIP_MANAGE,
    PERMISSIONS.ASSET_CUSTODIAN_MANAGE,
    PERMISSIONS.CHOIR_REPORTS_VIEW,
    PERMISSIONS.CHOIR_DEVOTION_CREATE,
    PERMISSIONS.CHOIR_DEVOTION_PUBLISH,
    PERMISSIONS.CHOIR_DEVOTION_MANAGE,
    PERMISSIONS.CHOIR_CUSTOM_ROLE_MANAGE,
    PERMISSIONS.COMMITTEE_ROLE_MANAGE_SCOPE,
    PERMISSIONS.COMMITTEE_MEMBER_MANAGE_SCOPE,
  ],

  [ROLES.CHOIR_PRESIDENT]: [
    ...CHOIR_OPERATIONS_PERMS,
    PERMISSIONS.CHOIR_FINANCE_VIEW,
    PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
    PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
    PERMISSIONS.MEMBER_MANAGE,
    PERMISSIONS.CHOIR_WELFARE_VIEW,
    PERMISSIONS.CHOIR_WELFARE_MANAGE,
    PERMISSIONS.CHOIR_MUSIC_VIEW,
    PERMISSIONS.CHOIR_MUSIC_MANAGE,
    PERMISSIONS.CHOIR_REHEARSAL_VIEW,
    PERMISSIONS.CHOIR_REHEARSAL_MANAGE,
    PERMISSIONS.CHOIR_ANNOUNCEMENT_MANAGE,
    PERMISSIONS.CHOIR_DOCUMENT_MANAGE,
    PERMISSIONS.CHOIR_MEETING_MANAGE,
    PERMISSIONS.CHOIR_UNIFORM_MANAGE,
    PERMISSIONS.CHOIR_EQUIPMENT_MANAGE,
    PERMISSIONS.ASSET_VIEW,
    PERMISSIONS.ASSET_CREATE,
    PERMISSIONS.ASSET_MANAGE,
    PERMISSIONS.ASSET_ASSIGN,
    PERMISSIONS.ASSET_MAINTAIN,
    PERMISSIONS.ASSET_REPORT,
    PERMISSIONS.ASSET_OWNERSHIP_MANAGE,
    PERMISSIONS.ASSET_CUSTODIAN_MANAGE,
    PERMISSIONS.CHOIR_REPORTS_VIEW,
    PERMISSIONS.CHOIR_DEVOTION_CREATE,
    PERMISSIONS.CHOIR_DEVOTION_PUBLISH,
    PERMISSIONS.CHOIR_DEVOTION_MANAGE,
    PERMISSIONS.CHOIR_CUSTOM_ROLE_MANAGE,
    PERMISSIONS.COMMITTEE_ROLE_MANAGE_SCOPE,
    PERMISSIONS.COMMITTEE_MEMBER_MANAGE_SCOPE,
  ],

  [ROLES.CHOIR_VICE_PRESIDENT]: [
    ...CHOIR_OPERATIONS_PERMS,
    PERMISSIONS.CHOIR_FINANCE_VIEW,
    PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
    PERMISSIONS.CHOIR_WELFARE_VIEW,
    PERMISSIONS.CHOIR_WELFARE_MANAGE,
    PERMISSIONS.CHOIR_JOIN_REVIEW,
    PERMISSIONS.CHOIR_REPORTS_VIEW,
    PERMISSIONS.CHOIR_ANNOUNCEMENT_MANAGE,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.CHOIR_DEVOTION_VIEW,
    PERMISSIONS.CHOIR_DEVOTION_PUBLISH,
    PERMISSIONS.MEMBER_MANAGE,
  ],

  [ROLES.CHOIR_SECRETARY]: [
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.EVENT_WRITE,
    PERMISSIONS.ASSIGNMENT_WRITE,
    PERMISSIONS.MEMBER_READ,
    PERMISSIONS.ATTENDANCE_WRITE,
    PERMISSIONS.SWAP_MANAGE,
    PERMISSIONS.DISCIPLINE_READ_ALL,
    PERMISSIONS.CHOIR_FINANCE_VIEW,
    PERMISSIONS.CHOIR_EVENTS_MANAGE_SCOPE,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.CHOIR_DEVOTION_VIEW,
  ],

  [ROLES.CHOIR_TREASURER]: [
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.CHOIR_FINANCE_VIEW,
    PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
    PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
    PERMISSIONS.CHOIR_WELFARE_VIEW,
    PERMISSIONS.CHOIR_WELFARE_MANAGE,
    PERMISSIONS.CHOIR_REPORTS_VIEW,
    PERMISSIONS.REPORT_EXPORT,
  ],

  [ROLES.CHOIR_REHEARSAL_DIRECTOR]: [
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.ASSIGNMENT_WRITE,
    PERMISSIONS.MEMBER_READ,
    PERMISSIONS.ATTENDANCE_WRITE,
    PERMISSIONS.CHOIR_ATTENDANCE_MANAGE,
    PERMISSIONS.ATTENDANCE_MARK_SCOPE,
    PERMISSIONS.CHOIR_MUSIC_VIEW,
    PERMISSIONS.CHOIR_MUSIC_MANAGE,
    PERMISSIONS.CHOIR_REHEARSAL_VIEW,
    PERMISSIONS.CHOIR_REHEARSAL_MANAGE,
    PERMISSIONS.CHOIR_ANNOUNCEMENT_MANAGE,
    PERMISSIONS.CHOIR_MEMBER_NOTIFY,
    PERMISSIONS.REPORT_EXPORT,
  ],

  [ROLES.CHOIR_LOGISTICS]: [
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.ASSIGNMENT_WRITE,
    PERMISSIONS.MEMBER_READ,
    PERMISSIONS.ATTENDANCE_WRITE,
    PERMISSIONS.CHOIR_ATTENDANCE_MANAGE,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.ASSET_VIEW,
    PERMISSIONS.ASSET_CREATE,
    PERMISSIONS.ASSET_ASSIGN,
    PERMISSIONS.ASSET_MAINTAIN,
    PERMISSIONS.ASSET_CUSTODIAN_MANAGE,
    PERMISSIONS.CHOIR_UNIFORM_MANAGE,
    PERMISSIONS.CHOIR_EQUIPMENT_MANAGE,
  ],

  [ROLES.CHOIR_COMMITTEE]: [
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.CHOIR_FINANCE_VIEW,
    PERMISSIONS.REPORT_EXPORT,
  ],

  [ROLES.CHOIR_FAMILY_COORDINATOR]: [
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.MEMBER_READ,
    PERMISSIONS.CHOIR_FAMILY_VIEW,
    PERMISSIONS.CHOIR_FAMILY_MANAGE,
    PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
    PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
    PERMISSIONS.CHOIR_CONTRIBUTION_CAMPAIGN_MANAGE,
    PERMISSIONS.CHOIR_CONTRIBUTION_TYPE_MANAGE,
    PERMISSIONS.FAMILY_VIEW,
    PERMISSIONS.FAMILY_MANAGE,
    PERMISSIONS.CHOIR_WELFARE_VIEW,
    PERMISSIONS.CHOIR_WELFARE_MANAGE,
    PERMISSIONS.CHOIR_MUSIC_VIEW,
    PERMISSIONS.CHOIR_REPORTS_VIEW,
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
    PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,
    PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,
    PERMISSIONS.PROTOCOL_FINANCE_VIEW,
    PERMISSIONS.FAMILY_VIEW,
    PERMISSIONS.FAMILY_MANAGE,
    ...PROTOCOL_ADMIN_PERMISSIONS,
    PERMISSIONS.PROTOCOL_TEAM_LEADER_EXECUTE,
    PERMISSIONS.COMMITTEE_ROLE_MANAGE_SCOPE,
    PERMISSIONS.COMMITTEE_MEMBER_MANAGE_SCOPE,
  ],

  [ROLES.PROTOCOL_ADMIN]: [
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.EVENT_WRITE,
    PERMISSIONS.ASSIGNMENT_WRITE,
    PERMISSIONS.MEMBER_READ,
    PERMISSIONS.ATTENDANCE_WRITE,
    PERMISSIONS.PROTOCOL_ATTENDANCE_MANAGE,
    PERMISSIONS.SWAP_MANAGE,
    PERMISSIONS.DISCIPLINE_READ_ALL,
    PERMISSIONS.DISCIPLINE_MANAGE,
    PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,
    PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,
    PERMISSIONS.PROTOCOL_FINANCE_VIEW,
    PERMISSIONS.FAMILY_VIEW,
    PERMISSIONS.FAMILY_MANAGE,
    ...PROTOCOL_ADMIN_PERMISSIONS,
    PERMISSIONS.PROTOCOL_TEAM_LEADER_EXECUTE,
    PERMISSIONS.COMMITTEE_ROLE_MANAGE_SCOPE,
    PERMISSIONS.COMMITTEE_MEMBER_MANAGE_SCOPE,
  ],

  [ROLES.CHURCH_ADMIN]: [...CHURCH_ADMIN_OPERATIONAL_PERMISSIONS],
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
};

const DEFAULT_CHOIR_COMMITTEE_ROLES = [
  {
    name: 'president',
    permissions: [
      ...CHOIR_OPERATIONS_PERMS,
      PERMISSIONS.CHOIR_FINANCE_VIEW,
      PERMISSIONS.MEMBER_MANAGE,
      PERMISSIONS.CHOIR_WELFARE_MANAGE,
      PERMISSIONS.CHOIR_REPORTS_VIEW,
    ],
  },
  {
    name: 'vice_president',
    permissions: [
      ...CHOIR_OPERATIONS_PERMS,
      PERMISSIONS.CHOIR_FINANCE_VIEW,
      PERMISSIONS.CHOIR_WELFARE_VIEW,
      PERMISSIONS.CHOIR_WELFARE_MANAGE,
      PERMISSIONS.CHOIR_JOIN_REVIEW,
      PERMISSIONS.CHOIR_REPORTS_VIEW,
      PERMISSIONS.CHOIR_ANNOUNCEMENT_MANAGE,
      PERMISSIONS.REPORT_EXPORT,
      PERMISSIONS.CHOIR_DEVOTION_VIEW,
      PERMISSIONS.CHOIR_DEVOTION_PUBLISH,
      PERMISSIONS.MEMBER_MANAGE,
    ],
  },
  {
    name: 'music_director',
    permissions: [
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.ASSIGNMENT_WRITE,
      PERMISSIONS.ATTENDANCE_WRITE,
      PERMISSIONS.CHOIR_ATTENDANCE_MANAGE,
      PERMISSIONS.CHOIR_MUSIC_VIEW,
      PERMISSIONS.CHOIR_MUSIC_MANAGE,
      PERMISSIONS.CHOIR_REHEARSAL_VIEW,
      PERMISSIONS.CHOIR_REHEARSAL_MANAGE,
      PERMISSIONS.CHOIR_ANNOUNCEMENT_MANAGE,
      PERMISSIONS.CHOIR_MEMBER_NOTIFY,
    ],
  },
  {
    name: 'family_coordinator',
    permissions: [
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.MEMBER_READ,
      PERMISSIONS.FAMILY_VIEW,
      PERMISSIONS.FAMILY_MANAGE,
      PERMISSIONS.CHOIR_FAMILY_VIEW,
      PERMISSIONS.CHOIR_FAMILY_MANAGE,
      PERMISSIONS.CHOIR_WELFARE_VIEW,
      PERMISSIONS.CHOIR_WELFARE_MANAGE,
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_FAMILY,
      PERMISSIONS.CHOIR_OPS_VIEW,
      PERMISSIONS.CHOIR_OPS_REPORT,
      PERMISSIONS.CHOIR_OPS_ATTENDANCE,
      PERMISSIONS.CHOIR_ATTENDANCE_MANAGE,
    ],
  },
  {
    name: 'family_head',
    permissions: [
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.FAMILY_VIEW,
      PERMISSIONS.CHOIR_FAMILY_VIEW,
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_FAMILY,
      PERMISSIONS.ATTENDANCE_MARK_SCOPE,
      PERMISSIONS.CHOIR_OPS_VIEW,
    ],
  },
  {
    name: 'advisor',
    permissions: [
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.CHOIR_FINANCE_VIEW,
      PERMISSIONS.CHOIR_REPORTS_VIEW,
      PERMISSIONS.DISCIPLINE_READ_ALL,
    ],
  },
  {
    name: 'secretary',
    permissions: [
      PERMISSIONS.CHOIR_RECORDS_VIEW,
      PERMISSIONS.CHOIR_OPS_VIEW,
      PERMISSIONS.CHOIR_OPS_REPORT,
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.EVENT_WRITE,
      PERMISSIONS.ASSIGNMENT_WRITE,
      PERMISSIONS.MEMBER_READ,
      PERMISSIONS.ATTENDANCE_WRITE,
      PERMISSIONS.SWAP_MANAGE,
      PERMISSIONS.CHOIR_EVENTS_MANAGE_SCOPE,
      PERMISSIONS.CHOIR_OPS_SCHEDULE,
      PERMISSIONS.REPORT_EXPORT,
      PERMISSIONS.CHOIR_REPORTS_VIEW,
      PERMISSIONS.AUDIT_READ,
      PERMISSIONS.CHOIR_MUSIC_VIEW,
      PERMISSIONS.CHOIR_MUSIC_MANAGE,
      PERMISSIONS.CHOIR_REHEARSAL_VIEW,
      PERMISSIONS.CHOIR_REHEARSAL_MANAGE,
      PERMISSIONS.CHOIR_DOCUMENT_MANAGE,
      PERMISSIONS.CHOIR_MEETING_MANAGE,
      PERMISSIONS.CHOIR_ANNOUNCEMENT_MANAGE,
      PERMISSIONS.ASSET_VIEW,
      PERMISSIONS.ASSET_REPORT,
      PERMISSIONS.CHOIR_UNIFORM_MANAGE,
      PERMISSIONS.CHOIR_EQUIPMENT_MANAGE,
      PERMISSIONS.CHOIR_DEVOTION_VIEW,
    ],
  },
  {
    name: 'treasurer',
    permissions: [
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.CHOIR_FINANCE_VIEW,
      PERMISSIONS.CHOIR_FINANCE_MANAGE,
      PERMISSIONS.CHOIR_FINANCE_APPROVE,
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
      PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
      PERMISSIONS.CHOIR_CONTRIBUTION_TYPE_MANAGE,
      PERMISSIONS.CHOIR_CONTRIBUTION_CAMPAIGN_MANAGE,
      PERMISSIONS.CHOIR_WELFARE_VIEW,
      PERMISSIONS.CHOIR_REPORTS_VIEW,
      PERMISSIONS.REPORT_EXPORT,
      PERMISSIONS.MINISTRY_FINANCE_VIEW,
      PERMISSIONS.MINISTRY_FINANCE_REPORT,
    ],
  },
  {
    name: 'discipline_social_welfare',
    permissions: [
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.MEMBER_READ,
      PERMISSIONS.ATTENDANCE_WRITE,
      PERMISSIONS.CHOIR_ATTENDANCE_MANAGE,
      PERMISSIONS.CHOIR_OPS_ATTENDANCE,
      PERMISSIONS.ATTENDANCE_MARK_SCOPE,
      PERMISSIONS.CHOIR_RULES_VIEW,
      PERMISSIONS.CHOIR_RULES_MANAGE,
      PERMISSIONS.DISCIPLINE_READ_ALL,
      PERMISSIONS.DISCIPLINE_MANAGE,
      PERMISSIONS.DISCIPLINE_REVIEW_SCOPE,
      PERMISSIONS.CHOIR_MEMBER_NOTIFY,
      PERMISSIONS.CHOIR_WELFARE_VIEW,
      PERMISSIONS.CHOIR_WELFARE_MANAGE,
      PERMISSIONS.CHOIR_FAMILY_VIEW,
      PERMISSIONS.CHOIR_ANNOUNCEMENT_MANAGE,
      PERMISSIONS.REPORT_EXPORT,
    ],
  },
  {
    name: 'spiritual_leader',
    permissions: [
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.MEMBER_PORTAL_VIEW,
      PERMISSIONS.CHOIR_DEVOTION_VIEW,
      PERMISSIONS.CHOIR_DEVOTION_CREATE,
      PERMISSIONS.CHOIR_DEVOTION_PUBLISH,
      PERMISSIONS.CHOIR_DEVOTION_MANAGE,
      PERMISSIONS.CHOIR_SPIRITUAL_PROGRAM_MANAGE,
      PERMISSIONS.CHOIR_INTERCESSION_MANAGE,
      PERMISSIONS.CHOIR_ANNOUNCEMENT_MANAGE,
      PERMISSIONS.CHOIR_MEMBER_NOTIFY,
    ],
  },
  {
    name: 'choir_member',
    permissions: [
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.MEMBER_PORTAL_VIEW,
      PERMISSIONS.CHOIR_CONTRIBUTION_SUBMIT,
      PERMISSIONS.CHOIR_WELFARE_VIEW,
      PERMISSIONS.CHOIR_MUSIC_VIEW,
      PERMISSIONS.CHOIR_REHEARSAL_VIEW,
      PERMISSIONS.CHOIR_DEVOTION_VIEW,
    ],
  },
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

const DEFAULT_CONTRIBUTION_TYPE_CATALOG = [
  { id: 'ct-umusanzu', code: 'umusanzu', name: 'Umusanzu', description: 'Monthly choir contribution', sortOrder: 10 },
  { id: 'ct-inyubako', code: 'inyubako', name: 'Inyubako', description: 'Building fund contribution', sortOrder: 20 },
  { id: 'ct-uniform', code: 'uniform', name: 'Uniform', description: 'Uniform contribution', sortOrder: 30 },
  { id: 'ct-concert', code: 'concert', name: 'Concert', description: 'Concert-related contribution', sortOrder: 40 },
  { id: 'ct-live-recording', code: 'live_recording', name: 'Live Recording', description: 'Live recording contribution', sortOrder: 50 },
  { id: 'ct-special-project', code: 'special_project', name: 'Special Project', description: 'Other special project drives', sortOrder: 60 },
  { id: 'ct-other', code: 'other', name: 'Other', description: 'Other contribution — specify type on submit', sortOrder: 70 },
] as const;

async function main() {
  await prisma.choir.upsert({
    where: { id: MAIN_CHOIR_ID },
    create: {
      id: MAIN_CHOIR_ID,
      code: MAIN_CHOIR_CODE,
      name: 'Main Choir',
      description: 'Default choir — all legacy MVP data belongs here.',
      isActive: true,
    },
    update: {
      code: MAIN_CHOIR_CODE,
      name: 'Main Choir',
      isActive: true,
    },
  });

  await prisma.choirEngineSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default' },
    update: {},
  });

  await prisma.protocolEngineSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default' },
    update: {},
  });

  const portalChoirs: Array<{
    code: string;
    name: string;
    choirKind: 'PRIMARY' | 'SPECIAL' | 'CHILDREN';
    leaderDisplayName?: string;
  }> = [
    { code: 'IJWI_RY_UMWAMI', name: "Ijwi ry'Umwami Yesu", choirKind: 'PRIMARY' },
    { code: 'ELIM', name: 'Elim', choirKind: 'PRIMARY', leaderDisplayName: 'Choir Leader' },
    { code: 'INTEGUZA', name: 'Integuza', choirKind: 'PRIMARY' },
    { code: 'EL_BETHEL', name: 'El-Bethel', choirKind: 'PRIMARY' },
    { code: 'BEULAH', name: 'Beulah', choirKind: 'PRIMARY' },
    { code: 'CHILDREN_CHOIR', name: "Children's Choir", choirKind: 'CHILDREN' },
    { code: 'YERUSALEMU', name: 'Yerusalemu', choirKind: 'SPECIAL', leaderDisplayName: 'Morning Service' },
  ];

  for (const entry of portalChoirs) {
    await prisma.choir.upsert({
      where: { code: entry.code },
      create: {
        code: entry.code,
        name: entry.name,
        choirKind: entry.choirKind,
        leaderDisplayName: entry.leaderDisplayName,
        isPublicJoinable: true,
        isActive: true,
        description: `${entry.name} — church choir`,
      },
      update: {
        name: entry.name,
        choirKind: entry.choirKind,
        leaderDisplayName: entry.leaderDisplayName,
        isPublicJoinable: true,
        isActive: true,
      },
    });
  }

  for (const choir of await prisma.choir.findMany({ where: { isActive: true } })) {
    const isChildren = choir.code.includes('CHILDREN');
    const isFifth =
      choir.code.includes('FIFTH') ||
      choir.code.includes('5TH') ||
      choir.code === 'BEULAH';
    await prisma.choirServiceEligibility.upsert({
      where: { choirId: choir.id },
      create: {
        choirId: choir.id,
        eligibleForMainServices: !isChildren || isChildren,
        eligibleForSunday1: true,
        eligibleForSunday2: !isChildren,
        eligibleForTuesday: !isChildren,
        eligibleForIgaburo: !isChildren,
        eligibleForSpecialEvents: true,
        isChildrenChoir: isChildren,
        isFifthSundayChoir: isFifth,
        priority: isChildren ? 10 : isFifth ? 5 : 0,
      },
      update: {
        isChildrenChoir: isChildren,
        isFifthSundayChoir: isFifth,
      },
    });
  }

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

  for (const entry of DEFAULT_CONTRIBUTION_TYPE_CATALOG) {
    await prisma.contributionTypeCatalog.upsert({
      where: {
        choirId_code: {
          choirId: MAIN_CHOIR_ID,
          code: entry.code,
        },
      },
      create: {
        choirId: MAIN_CHOIR_ID,
        code: entry.code,
        name: entry.name,
        description: entry.description,
        sortOrder: entry.sortOrder,
        ministryScope: 'CHOIR',
        active: true,
      },
      update: {
        name: entry.name,
        description: entry.description,
        sortOrder: entry.sortOrder,
        active: true,
      },
    });
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
          onboardingCompleted: true,
          phone: '0788000000',
        },
      },
      userRoles: { create: { roleId: adminRole.id } },
    },
    update: {
      member: {
        update: {
          onboardingCompleted: true,
          status: 'ACTIVE',
          phone: '0788000000',
        },
      },
    },
    include: { member: true },
  });

  const defaultChoirScope = MAIN_CHOIR_ID;
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

  for (const entry of DEFAULT_MINISTRIES) {
    const ministry = await prisma.ministry.upsert({
      where: { code: entry.code },
      create: {
        code: entry.code,
        name: entry.name,
        description: entry.description,
        isActive: true,
        settings: { create: {} },
      },
      update: {
        name: entry.name,
        description: entry.description,
        isActive: true,
      },
    });

    await prisma.ministrySettings.upsert({
      where: { ministryId: ministry.id },
      create: { ministryId: ministry.id },
      update: {},
    });

    for (const position of leadershipPositionsForMinistry(entry.code)) {
      await prisma.ministryLeadershipPosition.upsert({
        where: {
          ministryId_name: {
            ministryId: ministry.id,
            name: position.name,
          },
        },
        create: {
          ministryId: ministry.id,
          name: position.name,
          description: position.description,
          isSystem: position.isSystem,
          isActive: true,
        },
        update: {
          description: position.description,
          isSystem: position.isSystem,
          isActive: true,
        },
      });
    }
  }

  const ministryByCode = new Map(
    (
      await prisma.ministry.findMany({
        select: { id: true, code: true },
      })
    ).map((m) => [m.code, m.id]),
  );

  for (const ministryCode of ['MUSIC', 'DEACONS']) {
    const ministryId = ministryByCode.get(ministryCode);
    if (!ministryId) continue;
    await prisma.ministrySettings.upsert({
      where: { ministryId },
      create: { ministryId, allowOperationalUnits: true },
      update: { allowOperationalUnits: true },
    });
  }

  for (const entry of DEFAULT_OPERATIONAL_UNITS) {
    const ministryId = ministryByCode.get(entry.ministryCode);
    if (!ministryId) continue;

    const unit = await prisma.operationalUnit.upsert({
      where: {
        ministryId_code: { ministryId, code: entry.code },
      },
      create: {
        ministryId,
        code: entry.code,
        name: entry.name,
        description: entry.description,
        type: entry.type,
        isActive: true,
        settings: { create: {} },
      },
      update: {
        name: entry.name,
        description: entry.description,
        type: entry.type,
        isActive: true,
      },
    });

    await prisma.operationalUnitSettings.upsert({
      where: { operationalUnitId: unit.id },
      create: { operationalUnitId: unit.id },
      update: {},
    });

    const unitPositions = entry.positions ?? DEFAULT_UNIT_POSITIONS;
    for (const position of unitPositions) {
      await prisma.operationalUnitLeadershipPosition.upsert({
        where: {
          operationalUnitId_name: {
            operationalUnitId: unit.id,
            name: position.name,
          },
        },
        create: {
          operationalUnitId: unit.id,
          name: position.name,
          description: position.description,
          isSystem: position.isSystem,
          isActive: true,
        },
        update: {
          description: position.description,
          isSystem: position.isSystem,
          isActive: true,
        },
      });
    }
  }

  await prisma.choirMembership.upsert({
    where: {
      userId_choirId: { userId: admin.id, choirId: MAIN_CHOIR_ID },
    },
    create: {
      userId: admin.id,
      choirId: MAIN_CHOIR_ID,
      role: ROLES.SUPER_ADMIN,
      isActive: true,
    },
    update: { isActive: true },
  });

  console.log('Seed complete. Admin:', admin.email, '/ Admin@123');
  console.log(
    'Choir officer roles:',
    Object.keys(CHOIR_OFFICER_META).join(', '),
  );

  const intercessors = await prisma.ministry.findUnique({
    where: { code: 'INTERCESSORS' },
  });
  const musicMinistry = await prisma.ministry.findUnique({
    where: { code: 'MUSIC' },
  });
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  await prisma.churchWeeklyActivity.deleteMany({});
  await prisma.churchWeeklyActivity.createMany({
    data: [
      {
        title: 'Mid-week Bible study',
        description: 'Church-wide teaching and fellowship',
        dayOfWeek: 3,
        startTime: '18:30',
        endTime: '20:00',
        location: 'Main sanctuary',
        ministryId: intercessors?.id,
        sortOrder: 1,
      },
      {
        title: 'Choir rehearsal',
        description: 'Music ministry weekly rehearsal',
        dayOfWeek: 4,
        startTime: '17:00',
        endTime: '19:30',
        ministryId: musicMinistry?.id,
        sortOrder: 2,
      },
      {
        title: 'Intercessors prayer',
        description: 'Corporate prayer for the church',
        dayOfWeek: 5,
        startTime: '06:00',
        endTime: '07:30',
        ministryId: intercessors?.id,
        sortOrder: 3,
      },
    ],
  });

  const devotionTypes = [
    { type: 'TWO_DAY_PRAYER' as const, title: 'Prayer focus — today', prayerDate: todayStart },
    { type: 'TWO_DAY_PRAYER' as const, title: 'Prayer focus — tomorrow', prayerDate: tomorrowStart },
    { type: 'ENCOURAGEMENT' as const, title: 'Word of encouragement', prayerDate: null },
    { type: 'TESTIMONY' as const, title: 'Testimony of faith', prayerDate: null },
    { type: 'GRATITUDE' as const, title: 'Gratitude', prayerDate: null },
    { type: 'PRAISE' as const, title: 'Praise', prayerDate: null },
  ];
  for (const d of devotionTypes) {
    const existing = await prisma.devotion.findFirst({
      where: { choirId: MAIN_CHOIR_ID, type: d.type, title: d.title },
    });
    if (!existing) {
      await prisma.devotion.create({
        data: {
          choirId: MAIN_CHOIR_ID,
          title: d.title,
          content:
            d.type === 'TWO_DAY_PRAYER'
              ? 'Join us in united prayer for our church, families, and nation.'
              : 'May the Lord strengthen and comfort you today.',
          type: d.type,
          prayerDate: d.prayerDate,
          publishedAt: now,
          createdById: admin.id,
        },
      });
    }
  }

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
