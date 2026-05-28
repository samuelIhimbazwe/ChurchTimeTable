/**
 * Assign a role to a user by email.
 *
 * Usage:
 *   npx ts-node scripts/assign-user-role.ts user@church.local CHOIR_LEADER
 *   npx ts-node scripts/assign-user-role.ts user@church.local CHOIR_COMMITTEE --add
 *   npx ts-node scripts/assign-user-role.ts user@church.local PROTOCOL_LEADER --replace
 *
 * Role must exist (run npm run prisma:seed after adding new roles in seed.ts).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const roleName = process.argv[3];
  const flags = new Set(process.argv.slice(4));
  const addOnly = flags.has('--add');
  const replace = flags.has('--replace');

  if (!email || !roleName) {
    console.error(
      'Usage: npx ts-node scripts/assign-user-role.ts <email> <ROLE_NAME> [--add|--replace]',
    );
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    console.error(
      `Role not found: ${roleName}. Add it to seed.ts and run: npm run prisma:seed`,
    );
    process.exit(1);
  }

  if (replace && !addOnly) {
    await prisma.userRole.deleteMany({ where: { userId: user.id } });
    console.log('Removed existing roles for user.');
  }

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    create: { userId: user.id, roleId: role.id },
    update: {},
  });

  const roles = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: { role: true },
  });

  console.log(`Assigned ${roleName} to ${email}`);
  console.log('Current roles:', roles.map((r) => r.role.name).join(', '));
  console.log('User must log out and log in again for JWT permissions to update.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
