import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import {
  hasChoirOperations,
  hasProtocolCoordination,
  hasProtocolOversight,
  hasProtocolTeamHeadAuthority,
} from '../common/governance/governance-permissions.util';
import type { OperationalScopeContext } from './operational-scope.types';

const DEFAULT_PROTOCOL_MINISTRY = 'protocol-ministry';
const DEFAULT_CHOIR_SCOPE = 'default-choir';

@Injectable()
export class OperationalScopeService {
  constructor(
    private prisma: PrismaService,
    private permissionsResolver: PermissionsResolver,
  ) {}

  async buildForUser(actorUserId: string): Promise<OperationalScopeContext> {
    const { permissions } =
      await this.permissionsResolver.resolveForUser(actorUserId);

    const member = await this.prisma.member.findFirst({
      where: { userId: actorUserId },
      select: { id: true, ministry: true },
    });

    const memberId = member?.id;
    const canProtocolOversight = hasProtocolOversight(permissions);
    const canProtocolCoordinate = hasProtocolCoordination(permissions);
    let canProtocolTeamHead = hasProtocolTeamHeadAuthority(permissions);
    const canChoirOperations = hasChoirOperations(permissions);

    const headTeams = memberId
      ? await this.prisma.protocolServiceTeam.findMany({
          where: { teamHeadId: memberId, status: 'ACTIVE' },
          select: { id: true, members: { select: { memberId: true } } },
        })
      : [];

    if (headTeams.length > 0) {
      canProtocolTeamHead = true;
    }

    const teamIds = headTeams.map((t) => t.id);
    const teamMemberIds = headTeams.flatMap((t) =>
      t.members.map((m) => m.memberId),
    );

    const protocolAssignments = memberId
      ? await this.prisma.protocolCommitteeMember.findMany({
          where: { memberId },
          select: { ministryId: true },
        })
      : [];

    const choirAssignments = memberId
      ? await this.prisma.choirCommitteeMember.findMany({
          where: { memberId },
          select: { choirId: true },
        })
      : [];

    const protocolMinistryIds = [
      ...new Set([
        DEFAULT_PROTOCOL_MINISTRY,
        ...protocolAssignments.map((a) => a.ministryId),
      ]),
    ];

    const choirScopeIds = [
      ...new Set([
        DEFAULT_CHOIR_SCOPE,
        ...choirAssignments.map((a) => a.choirId),
      ]),
    ];

    const ministryIds = [
      ...new Set([
        ...(member?.ministry ? [member.ministry] : []),
        ...protocolMinistryIds,
      ]),
    ];

    let scopedMemberIds: string[] = [];
    if (canProtocolOversight || canProtocolCoordinate) {
      const allTeams = await this.prisma.protocolServiceTeam.findMany({
        where: { status: 'ACTIVE' },
        select: { members: { select: { memberId: true } } },
      });
      scopedMemberIds = [
        ...new Set(allTeams.flatMap((t) => t.members.map((m) => m.memberId))),
      ];
    } else if (canProtocolTeamHead) {
      scopedMemberIds = [...new Set(teamMemberIds)];
    }

    return {
      actorUserId,
      memberId,
      permissions,
      ministryIds,
      protocolMinistryIds,
      choirScopeIds,
      teamIds,
      scopedMemberIds,
      canProtocolOversight,
      canProtocolCoordinate,
      canProtocolTeamHead,
      canChoirOperations,
    };
  }
}
