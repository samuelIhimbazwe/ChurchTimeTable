/**
 * Audit platform admin permissions per user/role.
 * Run: npx ts-node scripts/audit-admin-permissions.ts
 */
import { PrismaClient } from '@prisma/client';
import {
  PLATFORM_ADMIN_PERMISSIONS,
  PLATFORM_ADMIN_PERMISSION_SET,
} from '../src/common/constants/roles';

const prisma = new PrismaClient();

function adminPermissions(codes: string[]): string[] {
  return codes.filter((code) => PLATFORM_ADMIN_PERMISSION_SET.has(code));
}

async function main() {
  const roles = await prisma.role.findMany({
    include: {
      rolePermissions: { include: { permission: true } },
    },
    orderBy: { name: 'asc' },
  });

  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: {
      member: { select: { firstName: true, lastName: true } },
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } },
            },
          },
        },
      },
    },
    orderBy: { email: 'asc' },
  });

  console.log('=== Role platform permission matrix ===');
  for (const role of roles) {
    const codes = role.rolePermissions.map((row) => row.permission.code);
    const platform = adminPermissions(codes);
    console.log(`\n${role.name} (${codes.length} total)`);
    console.log(`  platform: ${platform.length ? platform.join(', ') : '(none)'}`);
  }

  console.log('\n=== Active user platform permission audit ===');
  for (const user of users) {
    const rolesForUser = user.userRoles.map((row) => row.role.name);
    const codes = [
      ...new Set(
        user.userRoles.flatMap((row) =>
          row.role.rolePermissions.map((rp) => rp.permission.code),
        ),
      ),
    ];
    const platform = adminPermissions(codes);
    const name = user.member
      ? `${user.member.firstName} ${user.member.lastName}`.trim()
      : '—';
    console.log(`\n${user.email} · ${name}`);
    console.log(`  roles: ${rolesForUser.join(', ') || '(none)'}`);
    console.log(`  platform: ${platform.length ? platform.join(', ') : '(none)'}`);
  }

  console.log('\n=== Platform permission catalog ===');
  console.log(PLATFORM_ADMIN_PERMISSIONS.join('\n'));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
