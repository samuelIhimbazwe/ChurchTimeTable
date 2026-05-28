import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsResolver {
  constructor(private prisma: PrismaService) {}

  async resolveForUser(userId: string): Promise<{
    roles: string[];
    permissions: string[];
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        member: true,
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
    });

    if (!user) {
      return { roles: [], permissions: [] };
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.code),
        ),
      ),
    ];

    if (user.member) {
      const [choirAssignments, protocolAssignments] = await Promise.all([
        this.prisma.choirCommitteeMember.findMany({
          where: { memberId: user.member.id },
          include: { role: true },
        }),
        this.prisma.protocolCommitteeMember.findMany({
          where: { memberId: user.member.id },
          include: { role: true },
        }),
      ]);

      const parsePermissions = (value: unknown): string[] => {
        if (!Array.isArray(value)) return [];
        return value.filter((item): item is string => typeof item === 'string');
      };

      const scopedClaims = [
        ...choirAssignments.flatMap((item) =>
          parsePermissions(item.role.permissionsJson).map(
            (claim) => `committee:choir:${item.choirId}:${claim}`,
          ),
        ),
        ...protocolAssignments.flatMap((item) =>
          parsePermissions(item.role.permissionsJson).map(
            (claim) => `committee:protocol:${item.ministryId}:${claim}`,
          ),
        ),
      ];

      permissions.push(
        ...choirAssignments.flatMap((item) =>
          parsePermissions(item.role.permissionsJson),
        ),
        ...protocolAssignments.flatMap((item) =>
          parsePermissions(item.role.permissionsJson),
        ),
        ...scopedClaims,
      );
    }

    return { roles, permissions: [...new Set(permissions)] };
  }
}
