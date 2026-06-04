import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import {
  hasProtocolAttendanceManage,
  hasProtocolManage,
  hasProtocolTeamLeaderExecute,
} from './protocol-access.util';

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
    const assignment = await this.prisma.protocolOccurrenceTeamLeader.findUnique({
      where: { teamId },
    });
    return assignment?.protocolTeamLeaderId === leader.id;
  }

  async canManageTeamAttendance(userId: string, teamId: string): Promise<boolean> {
    const resolved = await this.permissions.resolveForUser(userId);
    if (hasProtocolAttendanceManage(resolved.permissions)) return true;
    if (!hasProtocolTeamLeaderExecute(resolved.permissions)) return false;
    return this.isLeaderForTeam(userId, teamId);
  }

  async canManageTeam(userId: string, teamId: string): Promise<boolean> {
    const resolved = await this.permissions.resolveForUser(userId);
    if (hasProtocolManage(resolved.permissions)) return true;
    if (!hasProtocolTeamLeaderExecute(resolved.permissions)) return false;
    return this.isLeaderForTeam(userId, teamId);
  }
}
