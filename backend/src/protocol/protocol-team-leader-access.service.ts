import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import {
  hasProtocolAttendanceManage,
  hasProtocolManage,
  hasProtocolTeamLeaderExecute,
} from './protocol-access.util';
import { hasProtocolTeamHeadAuthority } from '../common/governance/governance-permissions.util';

@Injectable()
export class ProtocolTeamLeaderAccessService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
  ) {}

  async getLeaderForUser(userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      include: { protocolTeamLeader: true },
    });
    return member?.protocolTeamLeader ?? null;
  }

  async isLeaderForTeam(userId: string, teamId: string): Promise<boolean> {
    const leader = await this.getLeaderForUser(userId);
    if (!leader?.active) return false;
    const assignment = await this.prisma.protocolOccurrenceTeamLeader.findFirst({
      where: { teamId, protocolTeamLeaderId: leader.id },
    });
    return !!assignment;
  }

  async canManageTeamAttendance(userId: string, teamId: string): Promise<boolean> {
    const resolved = await this.permissions.resolveForUser(userId);
    if (hasProtocolManage(resolved.permissions)) return true;
    const isTeamHead =
      hasProtocolTeamHeadAuthority(resolved.permissions) ||
      hasProtocolTeamLeaderExecute(resolved.permissions);
    if (isTeamHead) {
      return this.isLeaderForTeam(userId, teamId);
    }
    if (hasProtocolAttendanceManage(resolved.permissions)) return true;
    return false;
  }

  async canReviewTeamReplacements(userId: string, teamId: string): Promise<boolean> {
    const resolved = await this.permissions.resolveForUser(userId);
    if (
      hasProtocolManage(resolved.permissions) ||
      resolved.permissions.includes('protocol.replacement.manage')
    ) {
      return true;
    }
    const isTeamHead =
      hasProtocolTeamHeadAuthority(resolved.permissions) ||
      hasProtocolTeamLeaderExecute(resolved.permissions);
    if (!isTeamHead) return false;
    return this.isLeaderForTeam(userId, teamId);
  }

  async ledTeamIds(userId: string): Promise<string[]> {
    const leader = await this.getLeaderForUser(userId);
    if (!leader?.active) return [];
    const rows = await this.prisma.protocolOccurrenceTeamLeader.findMany({
      where: { protocolTeamLeaderId: leader.id },
      select: { teamId: true },
    });
    return rows.map((r) => r.teamId);
  }

  async canManageTeam(userId: string, teamId: string): Promise<boolean> {
    const resolved = await this.permissions.resolveForUser(userId);
    if (hasProtocolManage(resolved.permissions)) return true;
    if (resolved.permissions.includes('protocol.team.manage')) return true;
    const isTeamHead =
      hasProtocolTeamHeadAuthority(resolved.permissions) ||
      hasProtocolTeamLeaderExecute(resolved.permissions);
    if (!isTeamHead) return false;
    return this.isLeaderForTeam(userId, teamId);
  }
}
