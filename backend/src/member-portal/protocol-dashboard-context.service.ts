import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { ROLES } from '../common/constants/roles';
import { ProtocolMembershipService } from './protocol-membership.service';
import {
  DEFAULT_PROTOCOL_MINISTRY_ID,
  formatProtocolCommitteeRoleName,
  inferProtocolCommitteeRoleKeys,
  isProtocolScopedDashboardPermission,
  resolveProtocolLandingPath,
} from './protocol-officer-roles.util';

const PROTOCOL_ADMIN_OVERRIDE_ROLES = new Set<string>([
  ROLES.SUPER_ADMIN,
  ROLES.CHURCH_ADMIN,
  ROLES.PROTOCOL_ADMIN,
  ROLES.PROTOCOL_LEADER,
]);

const MEMBER_BASELINE_PERMISSIONS = [
  'member.portal.view',
  'event:read',
  'protocol.view',
] as const;

export type ProtocolDashboardPosition = {
  roleKey: string;
  roleName: string;
  permissions: string[];
};

export type ProtocolDashboardContext = {
  ministry: {
    id: string;
    name: string;
  };
  membership: {
    isActive: true;
  } | null;
  positions: ProtocolDashboardPosition[];
  permissions: string[];
  landingPath: string;
  canAccess: boolean;
};

@Injectable()
export class ProtocolDashboardContextService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
    private protocolMembership: ProtocolMembershipService,
  ) {}

  async getContext(userId: string): Promise<ProtocolDashboardContext> {
    const ministry = {
      id: DEFAULT_PROTOCOL_MINISTRY_ID,
      name: 'Protocol Team',
    };

    const resolved = await this.permissions.resolveForUser(userId);
    const isAdminOverride = resolved.roles.some((r) =>
      PROTOCOL_ADMIN_OVERRIDE_ROLES.has(r),
    );

    const member = resolved.memberId
      ? await this.prisma.member.findUnique({
          where: { id: resolved.memberId },
          select: { id: true },
        })
      : null;

    const isActiveMember = member
      ? await this.protocolMembership.isProtocolMember(member.id)
      : false;

    if (!isAdminOverride && !isActiveMember) {
      throw new ForbiddenException('Not an active protocol member');
    }

    const committeeRows = member
      ? await this.prisma.protocolCommitteeMember.findMany({
          where: { memberId: member.id, ministryId: ministry.id },
          include: { role: true },
        })
      : [];

    const positions: ProtocolDashboardPosition[] = committeeRows.map((row) => ({
      roleKey: row.role.name,
      roleName: formatProtocolCommitteeRoleName(row.role.name),
      permissions: parsePermissionsJson(row.role.permissionsJson),
    }));

    const assignedKeys = new Set(positions.map((p) => p.roleKey));
    for (const roleKey of inferProtocolCommitteeRoleKeys(resolved.roles)) {
      if (assignedKeys.has(roleKey)) continue;
      const committeeRole = await this.prisma.protocolCommitteeRole.findUnique({
        where: {
          ministryId_name: { ministryId: ministry.id, name: roleKey },
        },
      });
      positions.push({
        roleKey,
        roleName: formatProtocolCommitteeRoleName(roleKey),
        permissions: parsePermissionsJson(committeeRole?.permissionsJson),
      });
      assignedKeys.add(roleKey);
    }

    const permissionSet = new Set<string>(MEMBER_BASELINE_PERMISSIONS);

    if (isActiveMember || isAdminOverride) {
      for (const position of positions) {
        for (const perm of position.permissions) {
          permissionSet.add(perm);
        }
      }
      for (const perm of resolved.permissions) {
        if (isProtocolScopedDashboardPermission(perm)) {
          permissionSet.add(perm);
        }
      }
    }

    const scopedPrefix = `committee:protocol:${ministry.id}:`;
    for (const perm of resolved.permissions) {
      if (perm.startsWith(scopedPrefix)) {
        permissionSet.add(perm.slice(scopedPrefix.length));
      }
    }

    return {
      ministry,
      membership: isActiveMember ? { isActive: true as const } : null,
      positions,
      permissions: [...permissionSet],
      landingPath: resolveProtocolLandingPath(positions),
      canAccess: isAdminOverride || isActiveMember,
    };
  }
}

function parsePermissionsJson(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}
