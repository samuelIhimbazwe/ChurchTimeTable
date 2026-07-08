import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberStatus, MinistryScope } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import type { Prisma } from '@prisma/client';
import { ROLES } from '../common/constants/roles';
import { PROTOCOL_AUDIT, PROTOCOL_UNIT_CODE } from './protocol.constants';
import {
  hasProtocolManage,
  hasProtocolRankingView,
  hasProtocolView,
} from './protocol-access.util';
import { ProtocolPerformanceService } from './protocol-performance.service';
import { ServiceQuotaEngine } from './service-quota.engine';
import { ProtocolMembershipService } from '../member-portal/protocol-membership.service';
import { MemberMinistryScopeService } from '../member-portal/member-ministry-scope.service';
import { MemberNumberService } from '../members/member-number.service';
import { AppLinkService } from '../messaging/app-link.service';
import { OnboardingDeliveryService } from '../messaging/onboarding-delivery.service';

function generateTemporaryPassword(): string {
  return randomBytes(6)
    .toString('base64url')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 10)
    .padEnd(10, 'A');
}

@Injectable()
export class ProtocolMembersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private performance: ProtocolPerformanceService,
    private quota: ServiceQuotaEngine,
    private protocolMembership: ProtocolMembershipService,
    private ministryScope: MemberMinistryScopeService,
    private memberNumberService: MemberNumberService,
    private appLinks: AppLinkService,
    private onboardingDelivery: OnboardingDeliveryService,
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

  async listProfiles(
    actorUserId: string,
    options?: { q?: string; status?: 'active' | 'inactive' | 'all' },
  ) {
    await this.actor(actorUserId);
    const unitId = await this.getProtocolUnitId();
    const statusFilter = options?.status ?? 'all';
    const profiles = await this.prisma.protocolMemberProfile.findMany({
      where:
        statusFilter === 'active'
          ? { active: true }
          : statusFilter === 'inactive'
            ? { active: false }
            : {},
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberNumber: true,
          },
        },
        badges: { orderBy: { awardedAt: 'desc' }, take: 5 },
      },
      orderBy: { currentRank: 'asc' },
    });

    const memberIds = profiles.map((p) => p.memberId);
    const memberships = await this.prisma.operationalUnitMembership.findMany({
      where: { operationalUnitId: unitId, memberId: { in: memberIds } },
      select: { memberId: true, status: true },
    });
    const membershipByMember = new Map(
      memberships.map((m) => [m.memberId, m.status]),
    );

    const q = options?.q?.trim().toLowerCase();
    return profiles
      .map((profile) => {
        const membershipStatus = membershipByMember.get(profile.memberId) ?? 'INACTIVE';
        const memberStatus = !profile.active
          ? 'suspended'
          : membershipStatus === 'ACTIVE'
            ? 'active'
            : membershipStatus === 'INACTIVE'
              ? 'inactive'
              : 'removed';
        return {
          ...profile,
          memberId: profile.memberId,
          membershipStatus,
          memberStatus,
        };
      })
      .filter((row) => {
        if (!q) return true;
        const name = `${row.member.firstName ?? ''} ${row.member.lastName ?? ''}`.toLowerCase();
        const num = row.member.memberNumber?.toLowerCase() ?? '';
        return name.includes(q) || num.includes(q);
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

    const quota = await this.quota.quotaStatus(memberId, new Date());
    const unitId = await this.getProtocolUnitId();
    const membership = await this.prisma.operationalUnitMembership.findFirst({
      where: { operationalUnitId: unitId, memberId },
      select: { status: true, joinedAt: true },
    });

    const contributions = await this.prisma.contributionRecord.findMany({
      where: {
        memberId,
        contributionTypeCatalog: { ministryScope: 'PROTOCOL' },
        status: { in: ['CONFIRMED', 'SUBMITTED', 'PENDING'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        claimedAmount: true,
        confirmedAmount: true,
        status: true,
        createdAt: true,
        referenceNumber: true,
      },
    });

    return {
      ...profile,
      quota,
      membership,
      recentContributions: contributions.map((c) => ({
        id: c.id,
        amount: Number(c.confirmedAmount ?? c.claimedAmount),
        status: c.status,
        referenceNumber: c.referenceNumber,
        createdAt: c.createdAt,
      })),
      activity: await this.buildActivityTimeline(memberId),
    };
  }

  private async buildActivityTimeline(memberId: string) {
    const assignments = await this.prisma.protocolOccurrenceTeamMember.findMany({
      where: { memberId },
      include: {
        attendance: true,
        team: {
          include: {
            occurrence: { select: { title: true, startAt: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    const contributions = await this.prisma.contributionRecord.findMany({
      where: {
        memberId,
        contributionTypeCatalog: { ministryScope: 'PROTOCOL' },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        claimedAmount: true,
        status: true,
        createdAt: true,
      },
    });

    const events: Array<{
      id: string;
      kind: string;
      label: string;
      at: Date;
      meta?: string;
    }> = [];

    for (const row of assignments) {
      const occ = row.team.occurrence;
      events.push({
        id: `assign-${row.id}`,
        kind: 'assignment',
        label: occ.title,
        at: occ.startAt,
        meta: row.attendance?.outcome ?? 'ASSIGNED',
      });
    }
    for (const c of contributions) {
      events.push({
        id: `contrib-${c.id}`,
        kind: 'contribution',
        label: 'Unity contribution',
        at: c.createdAt,
        meta: `${Number(c.claimedAmount)} · ${c.status}`,
      });
    }

    return events
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 20)
      .map((e) => ({
        ...e,
        at: e.at.toISOString(),
      }));
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

  private async requireManage(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (!hasProtocolManage(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }
  }

  async provisionMember(
    actorUserId: string,
    data: {
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
    },
  ) {
    await this.requireManage(actorUserId);

    const email = data.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      include: { member: true },
    });

    const memberRole = await this.prisma.role.findUnique({
      where: { name: ROLES.MEMBER },
    });
    if (!memberRole) {
      throw new BadRequestException('System roles not seeded');
    }

    if (existingUser?.member) {
      if (await this.protocolMembership.isProtocolMember(existingUser.member.id)) {
        throw new ConflictException({
          code: 'CONFLICT',
          messageKey: 'ALREADY_PROTOCOL_MEMBER',
        });
      }
      await this.protocolMembership.ensureProtocolMembership(existingUser.member.id);
      await this.ministryScope.syncMinistryScope(existingUser.member.id);
      await this.ensureProfilesForMembers([existingUser.member.id]);
      await this.audit.log({
        userId: actorUserId,
        action: 'PROTOCOL_MEMBER_PROVISIONED_EXISTING',
        entity: 'OperationalUnitMembership',
        entityId: existingUser.member.id,
        newValue: { email },
      });
      return {
        email,
        memberId: existingUser.member.id,
        existingAccount: true,
        temporaryPassword: null as string | null,
        message:
          'Existing account was added to protocol ministry. Share login instructions separately.',
        delivery: null,
      };
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const memberNumber = await this.memberNumberService.generateMemberNumber(tx);
      const created = await tx.user.create({
        data: {
          email,
          passwordHash,
          mustChangePassword: true,
          termsAcceptedAt: new Date(),
          member: {
            create: {
              firstName: data.firstName.trim(),
              lastName: data.lastName.trim(),
              phone: data.phone?.trim() || null,
              ministry: MinistryScope.PROTOCOL,
              status: MemberStatus.ACTIVE,
              onboardingCompleted: false,
              memberNumber,
            },
          },
          userRoles: { create: { roleId: memberRole.id } },
        },
        include: { member: true },
      });

      const unit = await tx.operationalUnit.findFirstOrThrow({
        where: { code: PROTOCOL_UNIT_CODE },
      });
      await tx.operationalUnitMembership.create({
        data: {
          memberId: created.member!.id,
          operationalUnitId: unit.id,
          status: 'ACTIVE',
        },
      });

      return created;
    });

    await this.ministryScope.syncMinistryScope(user.member!.id);
    await this.ensureProfilesForMembers([user.member!.id]);

    const delivery = await this.onboardingDelivery.deliverCredentials({
      email,
      phone: data.phone,
      firstName: data.firstName,
      temporaryPassword,
      loginUrl: `${this.appLinks.baseUrl()}/login`,
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'PROTOCOL_MEMBER_PROVISIONED',
      entity: 'User',
      entityId: user.id,
      newValue: { email, delivery },
    });

    return {
      email,
      memberId: user.member!.id,
      existingAccount: false,
      temporaryPassword,
      message:
        'Share these credentials securely. The member must change their password on first login.',
      delivery,
    };
  }
}
