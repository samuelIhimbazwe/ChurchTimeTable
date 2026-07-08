import { Injectable } from '@nestjs/common';
import { MinistryScope } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES } from '../common/constants/roles';
import {
  DEFAULT_PROTOCOL_MINISTRY_ID,
  inferProtocolCommitteeRoleKeys,
  resolveProtocolLandingPath,
} from '../member-portal/protocol-officer-roles.util';
import {
  inferCommitteeRoleKeys,
  resolveChoirLandingPath,
} from '../member-portal/choir-officer-roles.util';

export interface AccessRouting {
  homePath: string;
  ministryScope: MinistryScope | null;
  isDualMember: boolean;
  hasChoirMembership: boolean;
  hasProtocolMembership: boolean;
  primaryChoirId: string | null;
}

const CHURCH_WIDE_STAFF_HOME: Partial<Record<string, string>> = {
  [ROLES.SUPER_ADMIN]: '/choir',
  [ROLES.CHURCH_ADMIN]: '/choir',
  [ROLES.PROTOCOL_ADMIN]: '/protocol',
  [ROLES.PROTOCOL_LEADER]: '/protocol',
  [ROLES.CHOIR_ADMIN]: '/choir',
};

/** Choir officers land on their choir hub — requires active choir membership. */
const CHOIR_OFFICER_ROLES = new Set<string>([
  ROLES.CHOIR_PRESIDENT,
  ROLES.CHOIR_VICE_PRESIDENT,
  ROLES.CHOIR_SECRETARY,
  ROLES.CHOIR_TREASURER,
  ROLES.CHOIR_REHEARSAL_DIRECTOR,
  ROLES.CHOIR_LOGISTICS,
  ROLES.CHOIR_FAMILY_COORDINATOR,
  ROLES.CHOIR_COMMITTEE,
  ROLES.CHOIR_LEADER,
]);

@Injectable()
export class AccessRoutingService {
  constructor(private prisma: PrismaService) {}

  async resolveForUser(
    userId: string,
    roles: string[],
  ): Promise<AccessRouting> {
    for (const role of roles) {
      if (CHURCH_WIDE_STAFF_HOME[role]) {
        return this.resolveChurchWideStaffRouting(
          userId,
          CHURCH_WIDE_STAFF_HOME[role]!,
        );
      }
    }

    for (const role of roles) {
      if (CHOIR_OFFICER_ROLES.has(role)) {
        return this.resolveChoirOfficerRouting(userId, roles);
      }
    }

    const member = await this.prisma.member.findUnique({
      where: { userId },
      select: { id: true, ministry: true },
    });

    if (!member) {
      return {
        homePath: '/dashboard',
        ministryScope: null,
        isDualMember: false,
        hasChoirMembership: false,
        hasProtocolMembership: false,
        primaryChoirId: null,
      };
    }

    const [hasChoirMembership, hasProtocolMembership, primaryChoir] =
      await Promise.all([
        this.hasActiveChoirMembership(userId),
        this.isProtocolMember(member.id),
        this.prisma.choirMembership.findFirst({
          where: { userId, isActive: true },
          orderBy: { joinedAt: 'asc' },
          select: { choirId: true },
        }),
      ]);

    const ministryScope = this.scopeFromMembership(
      hasChoirMembership,
      hasProtocolMembership,
      member.ministry,
    );
    const isDualMember = ministryScope === MinistryScope.BOTH;

    const protocolOfficerHome = hasProtocolMembership
      ? await this.protocolOfficerHomePath(member.id, roles)
      : null;

    if (isDualMember) {
      return {
        homePath: '/portal',
        ministryScope,
        isDualMember: true,
        hasChoirMembership,
        hasProtocolMembership,
        primaryChoirId: primaryChoir?.choirId ?? null,
      };
    }

    if (hasProtocolMembership) {
      return {
        homePath: protocolOfficerHome ?? '/protocol/member',
        ministryScope,
        isDualMember: false,
        hasChoirMembership,
        hasProtocolMembership,
        primaryChoirId: null,
      };
    }

    if (hasChoirMembership && primaryChoir) {
      return {
        homePath: `/choir/${primaryChoir.choirId}/membership`,
        ministryScope,
        isDualMember: false,
        hasChoirMembership,
        hasProtocolMembership,
        primaryChoirId: primaryChoir.choirId,
      };
    }

    return {
      homePath: '/dashboard',
      ministryScope,
      isDualMember: false,
      hasChoirMembership,
      hasProtocolMembership,
      primaryChoirId: null,
    };
  }

  private async resolveChurchWideStaffRouting(
    userId: string,
    homePath: string,
  ): Promise<AccessRouting> {
    const primaryChoir = await this.prisma.choirMembership.findFirst({
      where: { userId, isActive: true },
      orderBy: { joinedAt: 'asc' },
      select: { choirId: true },
    });
    return {
      homePath,
      ministryScope: null,
      isDualMember: false,
      hasChoirMembership: !!primaryChoir,
      hasProtocolMembership: false,
      primaryChoirId: primaryChoir?.choirId ?? null,
    };
  }

  private async resolveChoirOfficerRouting(
    userId: string,
    systemRoles: string[],
  ): Promise<AccessRouting> {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      select: { id: true, ministry: true },
    });

    const primaryChoir = await this.prisma.choirMembership.findFirst({
      where: { userId, isActive: true },
      orderBy: { joinedAt: 'asc' },
      select: { choirId: true },
    });

    if (!member || !primaryChoir) {
      return {
        homePath: '/choir',
        ministryScope: member?.ministry ?? null,
        isDualMember: false,
        hasChoirMembership: false,
        hasProtocolMembership: false,
        primaryChoirId: null,
      };
    }

    const homePath = await this.choirOfficerHomePath(
      member.id,
      primaryChoir.choirId,
      systemRoles,
    );

    return {
      homePath,
      ministryScope: MinistryScope.CHOIR,
      isDualMember: false,
      hasChoirMembership: true,
      hasProtocolMembership: false,
      primaryChoirId: primaryChoir.choirId,
    };
  }

  private async choirOfficerHomePath(
    memberId: string,
    choirId: string,
    systemRoles: string[],
  ): Promise<string> {
    const committeeRows = await this.prisma.choirCommitteeMember.findMany({
      where: { memberId, choirId },
      include: { role: { select: { name: true } } },
    });
    const positions = committeeRows.map((row) => ({
      roleKey: row.role.name,
    }));
    for (const roleKey of inferCommitteeRoleKeys(systemRoles)) {
      if (!positions.some((p) => p.roleKey === roleKey)) {
        positions.push({ roleKey });
      }
    }
    return resolveChoirLandingPath(choirId, positions);
  }

  private scopeFromMembership(
    hasChoir: boolean,
    hasProtocol: boolean,
    stored: MinistryScope,
  ): MinistryScope {
    if (hasChoir && hasProtocol) return MinistryScope.BOTH;
    if (hasChoir) return MinistryScope.CHOIR;
    if (hasProtocol) return MinistryScope.PROTOCOL;
    return stored;
  }

  private async hasActiveChoirMembership(userId: string): Promise<boolean> {
    const count = await this.prisma.choirMembership.count({
      where: { userId, isActive: true },
    });
    return count > 0;
  }

  private async isProtocolMember(memberId: string): Promise<boolean> {
    const unit = await this.prisma.operationalUnit.findFirst({
      where: { code: 'PROTOCOL_TEAM' },
    });
    if (!unit) return false;
    const row = await this.prisma.operationalUnitMembership.findFirst({
      where: {
        memberId,
        operationalUnitId: unit.id,
        status: 'ACTIVE',
      },
    });
    return !!row;
  }

  private async protocolOfficerHomePath(
    memberId: string,
    systemRoles: string[],
  ): Promise<string | null> {
    const committeeRows = await this.prisma.protocolCommitteeMember.findMany({
      where: { memberId, ministryId: DEFAULT_PROTOCOL_MINISTRY_ID },
      include: { role: { select: { name: true } } },
    });
    const positions = committeeRows.map((row) => ({ roleKey: row.role.name }));
    for (const roleKey of inferProtocolCommitteeRoleKeys(systemRoles)) {
      if (!positions.some((p) => p.roleKey === roleKey)) {
        positions.push({ roleKey });
      }
    }
    const landing = resolveProtocolLandingPath(positions);
    return landing === '/protocol/member' ? null : landing;
  }
}
