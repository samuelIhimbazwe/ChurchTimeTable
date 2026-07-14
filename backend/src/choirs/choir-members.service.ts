import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberStatus, MinistryScope } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ChoirRosterAccessService } from './choir-roster-access.service';
import { ChoirContextService } from './choir-context.service';
import { ChoirMembershipRulesService } from '../member-portal/choir-membership-rules.service';
import { MemberMinistryScopeService } from '../member-portal/member-ministry-scope.service';
import { MemberNumberService } from '../members/member-number.service';
import { ROLES } from '../common/constants/roles';
import { activeChoirCommitteeMemberWhere } from '../common/governance/choir-committee-member.util';
import { AppLinkService } from '../messaging/app-link.service';
import { OnboardingDeliveryService } from '../messaging/onboarding-delivery.service';

type ListQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

function scoreBand(score: number): 'excellent' | 'good' | 'needs_attention' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  return 'needs_attention';
}

function generateTemporaryPassword(): string {
  return randomBytes(6)
    .toString('base64url')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 10)
    .padEnd(10, 'A');
}

@Injectable()
export class ChoirMembersService {
  constructor(
    private prisma: PrismaService,
    private rosterAccess: ChoirRosterAccessService,
    private audit: AuditService,
    private choirContext: ChoirContextService,
    private membershipRules: ChoirMembershipRulesService,
    private memberNumberService: MemberNumberService,
    private ministryScope: MemberMinistryScopeService,
    private appLinks: AppLinkService,
    private onboardingDelivery: OnboardingDeliveryService,
  ) {}

  async listMembers(actorUserId: string, choirId: string, query: ListQuery = {}) {
    await this.rosterAccess.requireViewRoster(actorUserId, choirId);

    const choir = await this.prisma.choir.findFirst({
      where: { id: choirId, isActive: true },
      select: { id: true },
    });
    if (!choir) {
      throw new ForbiddenException('Choir not found');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 500);
    const skip = (page - 1) * limit;

    const where: Prisma.ChoirMembershipWhereInput = {
      choirId,
      isActive: true,
    };

    if (query.search?.trim()) {
      const q = query.search.trim();
      where.user = {
        member: {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { memberNumber: { contains: q } },
          ],
        },
      };
    }

    const [total, rows] = await Promise.all([
      this.prisma.choirMembership.count({ where }),
      this.prisma.choirMembership.findMany({
        where,
        orderBy: [{ user: { member: { lastName: 'asc' } } }, { joinedAt: 'asc' }],
        skip,
        take: limit,
        include: {
          user: {
            select: {
              member: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  status: true,
                  profile: { select: { voicePart: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    const memberIds = rows
      .map((r) => r.user.member?.id)
      .filter((id): id is string => Boolean(id));

    const profiles = memberIds.length
      ? await this.prisma.choirMemberParticipationProfile.findMany({
          where: { choirId, memberId: { in: memberIds } },
          select: {
            memberId: true,
            serviceAttendanceRate: true,
            overallParticipationScore: true,
          },
        })
      : [];

    const profileByMember = new Map(profiles.map((p) => [p.memberId, p]));

    const committeeRows = memberIds.length
      ? await this.prisma.choirCommitteeMember.findMany({
          where: { choirId, memberId: { in: memberIds } },
          include: { role: { select: { id: true, name: true } } },
        })
      : [];

    const familyRows = memberIds.length
      ? await this.prisma.familyMember.findMany({
          where: { memberId: { in: memberIds } },
          include: { family: { select: { id: true, familyName: true, choirId: true } } },
        })
      : [];

    const familyByMember = new Map<
      string,
      { familyId: string; familyName: string }
    >();
    for (const row of familyRows) {
      if (row.family.choirId && row.family.choirId !== choirId) continue;
      familyByMember.set(row.memberId, {
        familyId: row.family.id,
        familyName: row.family.familyName,
      });
    }

    const positionsByMember = new Map<
      string,
      Array<{ roleId: string; roleName: string }>
    >();
    for (const row of committeeRows) {
      const list = positionsByMember.get(row.memberId) ?? [];
      list.push({ roleId: row.roleId, roleName: row.role.name });
      positionsByMember.set(row.memberId, list);
    }

    const items = rows
      .filter((row) => row.user.member)
      .map((row) => {
        const member = row.user.member!;
        const profile = profileByMember.get(member.id);
        const score = Math.round(profile?.overallParticipationScore ?? 0);
        const attendanceRate = Math.round(profile?.serviceAttendanceRate ?? 0);
        const name = `${member.firstName} ${member.lastName}`.trim();
        const family = familyByMember.get(member.id);

        return {
          id: row.id,
          memberId: member.id,
          name,
          familyId: family?.familyId,
          familyName: family?.familyName,
          voicePart:
            member.profile?.voicePart && member.profile.voicePart !== 'UNSPECIFIED'
              ? member.profile.voicePart.replace(/_/g, ' ')
              : undefined,
          attendanceRate,
          score,
          scoreBand: scoreBand(score),
          duesPaid: true,
          status: member.status === 'ACTIVE' ? ('ACTIVE' as const) : ('INACTIVE' as const),
          positions: positionsByMember.get(member.id) ?? [],
        };
      });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async deactivateMembership(
    actorUserId: string,
    choirId: string,
    memberId: string,
  ) {
    await this.rosterAccess.requireManageRoster(actorUserId, choirId);

    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, userId: true, firstName: true, lastName: true },
    });
    if (!member?.userId) {
      throw new NotFoundException('Member not found');
    }

    const membership = await this.prisma.choirMembership.findUnique({
      where: {
        userId_choirId: { userId: member.userId, choirId },
      },
    });
    if (!membership) {
      throw new NotFoundException('Choir membership not found');
    }
    if (!membership.isActive) {
      throw new BadRequestException('Member is already inactive in this choir');
    }

    const updated = await this.prisma.choirMembership.update({
      where: { id: membership.id },
      data: { isActive: false },
    });

    await this.prisma.choirCommitteeMember.updateMany({
      where: {
        choirId,
        memberId,
        ...activeChoirCommitteeMemberWhere(),
      },
      data: { effectiveEnd: new Date() },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CHOIR_MEMBERSHIP_DEACTIVATE',
      entity: 'ChoirMembership',
      entityId: membership.id,
      oldValue: membership,
      newValue: updated,
    });

    return {
      deactivated: true,
      membershipId: membership.id,
      memberId,
      memberName: `${member.firstName} ${member.lastName}`.trim(),
    };
  }

  async provisionMember(
    actorUserId: string,
    data: {
      choirId: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
    },
  ) {
    const choirId = await this.resolveProvisionChoirId(actorUserId, data.choirId);
    await this.rosterAccess.requireManageRoster(actorUserId, choirId);

    const email = data.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      include: { member: true },
    });

    const choir = await this.prisma.choir.findFirst({
      where: { id: choirId, isActive: true },
    });
    if (!choir) {
      throw new NotFoundException(
        'Choir not found. Open member onboarding from your choir dashboard, or ask an admin to run demo seed on the server.',
      );
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const memberRole = await this.prisma.role.findUnique({
      where: { name: ROLES.MEMBER },
    });
    if (!memberRole) {
      throw new BadRequestException('System roles not seeded');
    }

    if (existingUser) {
      const activeMembership = await this.prisma.choirMembership.findFirst({
        where: {
          userId: existingUser.id,
          choirId,
          isActive: true,
        },
      });
      if (activeMembership) {
        throw new ConflictException({
          code: 'CONFLICT',
          messageKey: 'ALREADY_CHOIR_MEMBER',
        });
      }
      await this.membershipRules.validateNewMembership(
        existingUser.id,
        choirId,
      );
      await this.choirContext.ensureMembership(
        existingUser.id,
        choirId,
        ROLES.MEMBER,
      );
      if (existingUser.member) {
        await this.ministryScope.syncMinistryScope(existingUser.member.id);
      }
      await this.audit.log({
        userId: actorUserId,
        action: 'CHOIR_MEMBER_PROVISIONED_EXISTING',
        entity: 'ChoirMembership',
        entityId: choirId,
        newValue: { email, choirId },
      });
      return {
        email,
        memberId: existingUser.member?.id,
        existingAccount: true,
        temporaryPassword: null as string | null,
        message:
          'Existing account was added to this choir. Share login instructions separately.',
      };
    }

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
              ministry: MinistryScope.CHOIR,
              status: MemberStatus.ACTIVE,
              onboardingCompleted: false,
              memberNumber,
            },
          },
          userRoles: { create: { roleId: memberRole.id } },
        },
        include: { member: true },
      });

      await tx.choirMembership.create({
        data: {
          userId: created.id,
          choirId,
          role: ROLES.MEMBER,
          isActive: true,
        },
      });

      return created;
    });

    await this.ministryScope.syncMinistryScope(user.member!.id);

    const delivery = await this.onboardingDelivery.deliverCredentials({
      email,
      phone: data.phone,
      firstName: data.firstName,
      temporaryPassword,
      loginUrl: `${this.appLinks.baseUrl()}/login`,
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CHOIR_MEMBER_PROVISIONED',
      entity: 'User',
      entityId: user.id,
      newValue: { email, choirId, delivery },
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

  /** Resolve pilot/workspace choir id when UI sends a stale or portal-only id. */
  private async resolveProvisionChoirId(
    actorUserId: string,
    choirId: string,
  ): Promise<string> {
    const trimmed = choirId?.trim();
    if (trimmed) {
      const direct = await this.prisma.choir.findFirst({
        where: { id: trimmed, isActive: true },
        select: { id: true },
      });
      if (direct) return direct.id;
    }

    const actorMembership = await this.prisma.choirMembership.findFirst({
      where: { userId: actorUserId, isActive: true },
      orderBy: { joinedAt: 'asc' },
      select: { choirId: true },
    });
    if (actorMembership) {
      const fallback = await this.prisma.choir.findFirst({
        where: { id: actorMembership.choirId, isActive: true },
        select: { id: true },
      });
      if (fallback) return fallback.id;
    }

    throw new NotFoundException(
      'Choir not found. Open member onboarding from your choir dashboard, or ask an admin to run demo seed on the server.',
    );
  }
}
