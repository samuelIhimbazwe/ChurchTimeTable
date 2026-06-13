import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { AuditService } from '../audit/audit.service';
import { PERMISSIONS, ROLES } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { activeChoirCommitteeMemberWhere } from '../common/governance/choir-committee-member.util';

const ADMIN_ROLES: ReadonlySet<string> = new Set([
  ROLES.CHOIR_ADMIN,
  ROLES.CHURCH_ADMIN,
]);

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

@Injectable()
export class ChoirMembersService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
    private audit: AuditService,
  ) {}

  private async assertCanList(actorUserId: string, choirId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    const isAdmin = resolved.roles.some((r) => ADMIN_ROLES.has(r));

    const canView =
      isAdmin ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.MEMBER_READ) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_OPS_VIEW) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_OVERSIGHT) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.MEMBER_MANAGE) ||
      hasEffectivePermission(
        resolved.permissions,
        PERMISSIONS.ATTENDANCE_MARK_SCOPE,
      );

    if (!canView) {
      throw new ForbiddenException('Choir roster view denied');
    }

    if (isAdmin) return;

    const membership = await this.prisma.choirMembership.findUnique({
      where: { userId_choirId: { userId: actorUserId, choirId } },
    });
    if (!membership?.isActive) {
      throw new ForbiddenException('Not a member of this choir');
    }
  }

  async listMembers(actorUserId: string, choirId: string, query: ListQuery = {}) {
    await this.assertCanList(actorUserId, choirId);

    const choir = await this.prisma.choir.findFirst({
      where: { id: choirId, isActive: true },
      select: { id: true },
    });
    if (!choir) {
      throw new ForbiddenException('Choir not found');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
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

        return {
          id: row.id,
          memberId: member.id,
          name,
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

  private async assertCanManage(actorUserId: string, choirId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    const isAdmin = resolved.roles.some((r) => ADMIN_ROLES.has(r));
    const canManage =
      isAdmin ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.MEMBER_MANAGE) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_OPERATIONS_MANAGE);

    if (!canManage) {
      throw new ForbiddenException('Choir roster manage denied');
    }

    const choir = await this.prisma.choir.findFirst({
      where: { id: choirId, isActive: true },
      select: { id: true },
    });
    if (!choir) {
      throw new NotFoundException('Choir not found');
    }
  }

  async deactivateMembership(
    actorUserId: string,
    choirId: string,
    memberId: string,
  ) {
    await this.assertCanManage(actorUserId, choirId);

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
}
