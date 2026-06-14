import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import type { Prisma } from '@prisma/client';
import { PROTOCOL_AUDIT, PROTOCOL_UNIT_CODE } from './protocol.constants';
import {
  hasProtocolManage,
  hasProtocolRankingView,
  hasProtocolView,
} from './protocol-access.util';
import { ProtocolPerformanceService } from './protocol-performance.service';
import { ServiceQuotaEngine } from './service-quota.engine';

@Injectable()
export class ProtocolMembersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private performance: ProtocolPerformanceService,
    private quota: ServiceQuotaEngine,
  ) {}

  private async actor(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    if (!hasProtocolView(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }
    return { permissions: resolved.permissions };
  }

  async getProtocolUnitId() {
    const unit = await this.prisma.operationalUnit.findFirst({
      where: { code: PROTOCOL_UNIT_CODE, isActive: true },
    });
    if (!unit) throw new NotFoundException('Protocol unit not seeded');
    return unit.id;
  }

  async ensureProfilesForMembers(memberIds: string[]) {
    const unitId = await this.getProtocolUnitId();
    for (const memberId of memberIds) {
      await this.prisma.protocolMemberProfile.upsert({
        where: { memberId },
        create: { memberId, protocolUnitId: unitId },
        update: {},
      });
    }
  }

  async listProfiles(actorUserId: string) {
    await this.actor(actorUserId);
    return this.prisma.protocolMemberProfile.findMany({
      where: { active: true },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
        badges: { orderBy: { awardedAt: 'desc' }, take: 5 },
      },
      orderBy: { currentRank: 'asc' },
    });
  }

  async getProfile(actorUserId: string, memberId: string) {
    const { permissions } = await this.actor(actorUserId);
    const actorMember = await this.prisma.member.findUnique({
      where: { userId: actorUserId },
    });
    const isSelf = actorMember?.id === memberId;
    if (
      !isSelf &&
      !hasProtocolManage(permissions) &&
      !hasProtocolView(permissions)
    ) {
      throw new ForbiddenException('Denied');
    }

    const profile = await this.prisma.protocolMemberProfile.findUnique({
      where: { memberId },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
        badges: true,
      },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async myDashboard(actorUserId: string) {
    const member = await this.prisma.member.findUniqueOrThrow({
      where: { userId: actorUserId },
    });
    const profile = await this.prisma.protocolMemberProfile.findUnique({
      where: { memberId: member.id },
      include: { badges: true },
    });

    const assignments = await this.prisma.protocolOccurrenceTeamMember.findMany({
      where: {
        memberId: member.id,
        team: { status: { in: ['APPROVED', 'PUBLISHED'] } },
      },
      include: {
        team: {
          include: {
            occurrence: { select: { title: true, startAt: true } },
          },
        },
        attendance: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const quota = await this.quota.quotaStatus(member.id, new Date());

    return {
      profile,
      assignments,
      quota,
      rank: profile?.currentRank ?? null,
    };
  }

  async upsertProfile(
    actorUserId: string,
    memberId: string,
    data: { active?: boolean; notes?: string },
  ) {
    const { permissions } = await this.actor(actorUserId);
    if (!hasProtocolManage(permissions)) {
      throw new ForbiddenException('Denied');
    }
    const unitId = await this.getProtocolUnitId();
    const profile = await this.prisma.protocolMemberProfile.upsert({
      where: { memberId },
      create: { memberId, protocolUnitId: unitId, ...data },
      update: data,
    });

    await this.audit.log({
      userId: actorUserId,
      action: PROTOCOL_AUDIT.PROFILE_UPDATED,
      entity: 'ProtocolMemberProfile',
      entityId: profile.id,
      newValue: data as Prisma.InputJsonValue,
    });

    return profile;
  }

  async myStatistics(actorUserId: string) {
    const member = await this.prisma.member.findUniqueOrThrow({
      where: { userId: actorUserId },
    });
    let profile = await this.prisma.protocolMemberProfile.findUnique({
      where: { memberId: member.id },
      include: { badges: true },
    });
    if (profile) {
      await this.performance.refreshMemberStats(member.id);
      profile = await this.prisma.protocolMemberProfile.findUniqueOrThrow({
        where: { memberId: member.id },
        include: { badges: true },
      });
    }
    if (!profile) {
      return { memberId: member.id, profile: null, history: null };
    }
    return {
      memberId: member.id,
      profile,
      history: this.performance.buildServiceHistory(profile),
      badges: profile.badges,
    };
  }

  async canViewFullRanking(permissions: string[]) {
    if (hasProtocolRankingView(permissions)) return true;
    const settings = await this.quota.getSettings();
    return settings.membersCanViewFullRanking;
  }
}
