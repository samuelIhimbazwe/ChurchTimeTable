import { INestApplication } from '@nestjs/common';

import { PrismaService } from '../../src/prisma/prisma.service';



/** Tear down Nest app between e2e suites (Prisma disconnect via onModuleDestroy). */

export async function closeE2eApp(app: INestApplication) {

  await app.close();
  if (process.env.CMMS_E2E === '1') {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

}



export async function grantRolePermissions(

  prisma: PrismaService,

  roleName: string,

  permissions: string[],

) {

  const role = await prisma.role.upsert({

    where: { name: roleName },

    create: { name: roleName, description: roleName },

    update: {},

  });

  await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

  for (const code of [...new Set(permissions)]) {

    const permission = await prisma.permission.upsert({

      where: { code },

      create: { code, description: code },

      update: {},

    });

    await prisma.rolePermission.upsert({

      where: {

        roleId_permissionId: {

          roleId: role.id,

          permissionId: permission.id,

        },

      },

      create: { roleId: role.id, permissionId: permission.id },

      update: {},

    });

  }

  return role;

}



export async function syncRolePermissions(

  prisma: PrismaService,

  roleId: string,

  permissions: string[],

) {

  await prisma.rolePermission.deleteMany({ where: { roleId } });

  for (const code of [...new Set(permissions)]) {

    const permission = await prisma.permission.upsert({

      where: { code },

      create: { code, description: code },

      update: {},

    });

    await prisma.rolePermission.upsert({

      where: {

        roleId_permissionId: {

          roleId,

          permissionId: permission.id,

        },

      },

      create: { roleId, permissionId: permission.id },

      update: {},

    });

  }

}

