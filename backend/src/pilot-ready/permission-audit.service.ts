import { ForbiddenException, Injectable } from '@nestjs/common';
import { PERMISSIONS, ROLES } from '../common/constants/roles';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';

const AUDIT_ROLES = [
  ROLES.MEMBER,
  ROLES.CHOIR_PRESIDENT,
  ROLES.CHOIR_LEADER,
  ROLES.PROTOCOL_LEADER,
  ROLES.CHOIR_COMMITTEE,
  ROLES.CHURCH_ADMIN,
  ROLES.SUPER_ADMIN,
] as const;

const EXPECTED_MIN_PERMISSIONS: Record<string, string[]> = {
  [ROLES.MEMBER]: [PERMISSIONS.MEMBER_PORTAL_VIEW, PERMISSIONS.EVENT_READ],
  [ROLES.CHOIR_PRESIDENT]: [PERMISSIONS.CHOIR_OPS_VIEW, PERMISSIONS.CHOIR_JOIN_REVIEW],
  [ROLES.PROTOCOL_LEADER]: [PERMISSIONS.PROTOCOL_VIEW, PERMISSIONS.PROTOCOL_INVITE],
  [ROLES.CHURCH_ADMIN]: [PERMISSIONS.ADMIN_USERS_VIEW, PERMISSIONS.PILOT_READINESS_VIEW],
  [ROLES.SUPER_ADMIN]: [PERMISSIONS.ADMIN_USERS_MANAGE],
};

const SENSITIVE_PERMISSIONS = [
  PERMISSIONS.ADMIN_USERS_MANAGE,
  PERMISSIONS.ADMIN_ROLES_MANAGE,
  PERMISSIONS.ADMIN_SYNC_MANAGE,
  PERMISSIONS.CHOIR_FINANCE_APPROVE,
  PERMISSIONS.PROTOCOL_FINANCE_APPROVE,
];

@Injectable()
export class PermissionAuditService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
  ) {}

  private async assertAudit(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.PILOT_READINESS_VIEW) &&
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.ADMIN_ROLES_VIEW)
    ) {
      throw new ForbiddenException('Denied');
    }
  }

  async report(actorUserId: string) {
    await this.assertAudit(actorUserId);

    const roles = await this.prisma.role.findMany({
      where: { name: { in: [...AUDIT_ROLES] } },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
    });

    const findings = roles.map((role) => {
      const codes = role.rolePermissions.map((rp) => rp.permission.code);
      const expected = EXPECTED_MIN_PERMISSIONS[role.name] ?? [];
      const missing = expected.filter((p) => !codes.includes(p));
      const overPermissioned = codes.filter((p) =>
        SENSITIVE_PERMISSIONS.includes(p as (typeof SENSITIVE_PERMISSIONS)[number]),
      );
      const conflicts: string[] = [];
      if (role.name === ROLES.MEMBER && overPermissioned.length > 0) {
        conflicts.push('Member role has elevated permissions');
      }
      return {
        role: role.name,
        userCount: role._count.userRoles,
        permissionCount: codes.length,
        missingPermissions: missing,
        sensitivePermissions: overPermissioned,
        conflicts,
        overPermissioned: overPermissioned.length > 0,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      roles: findings,
      summary: {
        rolesAudited: findings.length,
        overPermissionedRoles: findings.filter((f) => f.overPermissioned).length,
        rolesWithMissing: findings.filter((f) => f.missingPermissions.length > 0).length,
        rolesWithConflicts: findings.filter((f) => f.conflicts.length > 0).length,
      },
    };
  }
}
