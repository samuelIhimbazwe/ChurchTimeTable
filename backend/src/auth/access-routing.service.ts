import { Injectable } from '@nestjs/common';
import { MinistryScope } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES } from '../common/constants/roles';
import {
  DEFAULT_PROTOCOL_MINISTRY_ID,
  inferProtocolCommitteeRoleKeys,
  resolveProtocolLandingPath,
} from '../member-portal/protocol-officer-roles.util';

export interface AccessRouting {
  homePath: string;
  ministryScope: MinistryScope | null;
  isDualMember: boolean;
  hasChoirMembership: boolean;
  hasProtocolMembership: boolean;
  primaryChoirId: string | null;
}

const STAFF_ROLE_HOME: Partial<Record<string, string>> = {
  [ROLES.SUPER_ADMIN]: '/system',
  [ROLES.CHURCH_ADMIN]: '/church',
  [ROLES.PROTOCOL_ADMIN]: '/protocol',
  [ROLES.PROTOCOL_LEADER]: '/protocol',
  [ROLES.CHOIR_ADMIN]: '/portal',
  [ROLES.CHOIR_PRESIDENT]: '/portal',
  [ROLES.CHOIR_VICE_PRESIDENT]: '/portal',
  [ROLES.CHOIR_SECRETARY]: '/portal',
  [ROLES.CHOIR_TREASURER]: '/portal',
  [ROLES.CHOIR_REHEARSAL_DIRECTOR]: '/portal',
  [ROLES.CHOIR_LOGISTICS]: '/portal',
  [ROLES.CHOIR_FAMILY_COORDINATOR]: '/portal',
  [ROLES.CHOIR_COMMITTEE]: '/portal',
  [ROLES.CHOIR_LEADER]: '/portal',
};

@Injectable()
export class AccessRoutingService {
  constructor(private prisma: PrismaService) {}

  async resolveForUser(
    userId: string,
    roles: string[],
  ): Promise<AccessRouting> {
    for (const role of roles) {
      const staffHome = STAFF_ROLE_HOME[role];
      if (staffHome) {
        return {
          homePath: staffHome,
          ministryScope: null,
          isDualMember: false,
          hasChoirMembership: false,
          hasProtocolMembership: false,
          primaryChoirId: null,
        };
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
        homePath: protocolOfficerHome ?? '/portal',
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
      homePath: '/portal',
      ministryScope,
      isDualMember: false,
      hasChoirMembership,
      hasProtocolMembership,
      primaryChoirId: null,
    };
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
