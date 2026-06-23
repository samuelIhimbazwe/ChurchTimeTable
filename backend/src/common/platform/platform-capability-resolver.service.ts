import { Injectable } from '@nestjs/common';
import { PermissionsResolver } from '../../auth/permissions.resolver';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES } from '../constants/roles';
import { dedupeScopedCapabilities } from '../choir/capability-can.util';
import type { ResolvedAuth, ScopedCapability } from '../choir/capability.types';
import {
  DEFAULT_PROTOCOL_MINISTRY_ID,
  inferProtocolCommitteeRoleKeys,
  isProtocolScopedDashboardPermission,
} from '../../member-portal/protocol-officer-roles.util';
import { ProtocolMembershipService } from '../../member-portal/protocol-membership.service';
import {
  mapPermissionToPlatformCapabilities,
  type PlatformDomain,
} from './platform-capability.util';

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

const SCOPE_IDS: Record<PlatformDomain, string> = {
  protocol: DEFAULT_PROTOCOL_MINISTRY_ID,
  church: 'church',
  platform: 'platform',
};

@Injectable()
export class PlatformCapabilityResolverService {
  constructor(
    private permissionsResolver: PermissionsResolver,
    private prisma: PrismaService,
    private protocolMembership: ProtocolMembershipService,
  ) {}

  async resolveProtocolAuth(userId: string): Promise<ResolvedAuth> {
    const permissions = await this.collectProtocolPermissions(userId);
    return this.buildAuth(userId, 'protocol', permissions);
  }

  async resolveChurchAuth(userId: string): Promise<ResolvedAuth> {
    const resolved = await this.permissionsResolver.resolveForUser(userId);
    return this.buildAuth(userId, 'church', resolved.permissions);
  }

  async resolvePlatformAuth(userId: string): Promise<ResolvedAuth> {
    const resolved = await this.permissionsResolver.resolveForUser(userId);
    return this.buildAuth(userId, 'platform', resolved.permissions);
  }

  can(resolvedAuth: ResolvedAuth | undefined, capabilityId: string): boolean {
    if (!resolvedAuth?.capabilities?.length) return false;
    return resolvedAuth.capabilities.some((cap) => cap.id === capabilityId);
  }

  private async collectProtocolPermissions(userId: string): Promise<string[]> {
    const ministryId = DEFAULT_PROTOCOL_MINISTRY_ID;
    const resolved = await this.permissionsResolver.resolveForUser(userId);
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
      return resolved.permissions;
    }

    const permissionSet = new Set<string>(MEMBER_BASELINE_PERMISSIONS);

    if (member) {
      const committeeRows = await this.prisma.protocolCommitteeMember.findMany({
        where: { memberId: member.id, ministryId },
        include: { role: true },
      });
      for (const row of committeeRows) {
        for (const perm of parsePermissionsJson(row.role.permissionsJson)) {
          permissionSet.add(perm);
        }
      }
    }

    for (const roleKey of inferProtocolCommitteeRoleKeys(resolved.roles)) {
      const committeeRole = await this.prisma.protocolCommitteeRole.findUnique({
        where: { ministryId_name: { ministryId, name: roleKey } },
      });
      for (const perm of parsePermissionsJson(committeeRole?.permissionsJson)) {
        permissionSet.add(perm);
      }
    }

    if (isActiveMember || isAdminOverride) {
      for (const perm of resolved.permissions) {
        if (isProtocolScopedDashboardPermission(perm)) {
          permissionSet.add(perm);
        }
      }
    }

    const scopedPrefix = `committee:protocol:${ministryId}:`;
    for (const perm of resolved.permissions) {
      if (perm.startsWith(scopedPrefix)) {
        permissionSet.add(perm.slice(scopedPrefix.length));
      }
    }

    return [...permissionSet];
  }

  private buildAuth(
    userId: string,
    domain: PlatformDomain,
    permissions: string[],
  ): ResolvedAuth {
    const caps: ScopedCapability[] = [];
    for (const perm of permissions) {
      for (const mapped of mapPermissionToPlatformCapabilities(perm)) {
        if (mapped.domain !== domain) continue;
        caps.push({ id: mapped.id });
      }
      const prefix = `committee:protocol:${SCOPE_IDS.protocol}:`;
      if (domain === 'protocol' && perm.startsWith(prefix)) {
        const stripped = perm.slice(prefix.length);
        for (const mapped of mapPermissionToPlatformCapabilities(stripped)) {
          if (mapped.domain === 'protocol') caps.push({ id: mapped.id });
        }
      }
    }

    return {
      userId,
      choirId: SCOPE_IDS[domain],
      capabilities: dedupeScopedCapabilities(caps),
    };
  }
}

function parsePermissionsJson(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}
