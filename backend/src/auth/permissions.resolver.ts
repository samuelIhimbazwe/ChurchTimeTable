import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Resolves effective permissions from DB role grants + committee assignments.
 * JWT payloads are rebuilt on each request/login — no legacy permission assumptions.
 */
@Injectable()
export class PermissionsResolver {
  constructor(private prisma: PrismaService) {}

  async resolveForUser(userId: string): Promise<{
    roles: string[];
    permissions: string[];
    memberId?: string;
    isActive: boolean;
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
      return { roles: [], permissions: [], isActive: false };
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
      const headTeams = await this.prisma.protocolServiceTeam.findMany({
        where: { teamHeadId: user.member.id, status: 'ACTIVE' },
        select: { id: true },
      });
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

      if (headTeams.length > 0) {
        permissions.push('protocol.team.head');
      }

      permissions.push(
        ...choirAssignments.flatMap((item) =>
          parsePermissions(item.role.permissionsJson),
        ),
        ...protocolAssignments.flatMap((item) =>
          parsePermissions(item.role.permissionsJson),
        ),
        ...scopedClaims,
      );

      const customAssignments =
        await this.prisma.choirMemberCustomRole.findMany({
          where: { memberId: user.member.id },
          include: {
            customRole: { include: { permissions: true } },
          },
        });
      permissions.push(
        ...customAssignments.flatMap((item) =>
          item.customRole.isActive
            ? item.customRole.permissions.map((p) => p.permission)
            : [],
        ),
      );

      const ministryAssignments =
        await this.prisma.ministryPermissionAssignment.findMany({
          where: { memberId: user.member.id, revokedAt: null },
          select: { ministryId: true, permission: true },
        });
      permissions.push(
        ...ministryAssignments.flatMap((item) => [
          item.permission,
          `ministry:${item.ministryId}:${item.permission}`,
        ]),
      );

      const unitAssignments =
        await this.prisma.operationalUnitPermissionAssignment.findMany({
          where: { memberId: user.member.id, revokedAt: null },
          select: { operationalUnitId: true, permission: true },
        });
      permissions.push(
        ...unitAssignments.flatMap((item) => [
          item.permission,
          `operational_unit:${item.operationalUnitId}:${item.permission}`,
        ]),
      );
    }

    return {
      roles,
      permissions: [...new Set(permissions)],
      memberId: user.member?.id,
      isActive: user.isActive,
    };
  }
}
