/**
 * Align CHOIR_TREASURER + committee treasurer permissions with the finance desk.
 * Removes: event:read, choir.welfare.manage, choir.sponsor.review
 */
import { PrismaClient } from '@prisma/client';

const REMOVE = [
  'event:read',
  'choir.welfare.manage',
  'choir.sponsor.review',
] as const;

function asPermissionList(raw: unknown): string[] | null {
  if (Array.isArray(raw)) return raw.map(String);
  if (raw && typeof raw === 'object' && Array.isArray((raw as { permissions?: unknown }).permissions)) {
    return ((raw as { permissions: unknown[] }).permissions).map(String);
  }
  return null;
}

async function main() {
  const prisma = new PrismaClient();
  const role = await prisma.role.findUnique({ where: { name: 'CHOIR_TREASURER' } });
  if (role) {
    const perms = await prisma.permission.findMany({
      where: { code: { in: [...REMOVE] } },
    });
    const result = await prisma.rolePermission.deleteMany({
      where: {
        roleId: role.id,
        permissionId: { in: perms.map((p) => p.id) },
      },
    });
    console.log(`CHOIR_TREASURER removed ${result.count} grants`);
  }

  const committee = await prisma.choirCommitteeRole.findMany({
    where: { name: 'treasurer' },
  });
  for (const c of committee) {
    const arr = asPermissionList(c.permissionsJson);
    if (!arr) continue;
    const next = arr.filter((p) => !(REMOVE as readonly string[]).includes(p));
    if (next.length === arr.length) continue;
    await prisma.choirCommitteeRole.update({
      where: { id: c.id },
      data: { permissionsJson: next },
    });
    console.log(`committee ${c.id} trimmed ${arr.length - next.length}`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
