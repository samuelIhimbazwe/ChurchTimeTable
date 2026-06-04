import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { ProtocolMembershipService } from './protocol-membership.service';
import { MAIN_CHOIR_ID } from '../common/constants/choir.constants';
import { DevotionType } from '@prisma/client';
import { ChoirMembershipRulesService } from './choir-membership-rules.service';
import {
  canAccessLeaderDashboard,
  hasChoirOperations,
  hasEffectivePermission,
  hasProtocolCoordination,
  hasProtocolOversight,
} from '../common/governance/governance-permissions.util';
import { PERMISSIONS } from '../common/constants/roles';

@Injectable()
export class MemberPortalDashboardService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
    private protocolMembership: ProtocolMembershipService,
    private choirRules: ChoirMembershipRulesService,
  ) {}

  async churchMemberDashboard(userId: string) {
    const member = await this.prisma.member.findUniqueOrThrow({
      where: { userId },
    });
    const now = new Date();
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);

    const [
      verseWidget,
      upcomingEvents,
      announcements,
      broadcasts,
      liveBroadcasts,
      occurrences,
      choirMemberships,
      ministries,
      joinRequests,
      invitations,
      claims,
    ] = await Promise.all([
      this.prisma.devotion.findFirst({
        where: {
          type: DevotionType.VERSE_OF_DAY,
          publishedAt: { lte: now },
          OR: [{ choirId: MAIN_CHOIR_ID }, { choirId: null }],
        },
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.event.findMany({
        where: {
          status: 'SCHEDULED',
          startTime: { gte: now, lte: in30 },
        },
        orderBy: { startTime: 'asc' },
        take: 5,
        select: { id: true, title: true, startTime: true, location: true },
      }),
      this.prisma.choirAnnouncement.findMany({
        where: {
          publishedAt: { lte: now },
          OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
        },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, body: true, publishedAt: true },
      }),
      this.prisma.churchBroadcast.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.churchBroadcast.findMany({
        where: { isLive: true },
        take: 3,
      }),
      this.prisma.operationOccurrence.findMany({
        where: {
          status: { in: ['PUBLISHED', 'APPROVED'] },
          startAt: { gte: now, lte: in30 },
        },
        orderBy: { startAt: 'asc' },
        take: 5,
        select: { id: true, title: true, startAt: true, endAt: true },
      }),
      this.prisma.choirMembership.findMany({
        where: { userId, isActive: true },
        include: { choir: { select: { id: true, name: true, code: true } } },
      }),
      this.prisma.ministryMembership.findMany({
        where: { memberId: member.id, status: 'ACTIVE' },
        include: { ministry: { select: { id: true, name: true, code: true } } },
      }),
      this.prisma.choirJoinRequest.findMany({
        where: { memberId: member.id, status: { in: ['PENDING', 'NEEDS_INFO'] } },
        include: { choir: { select: { name: true } } },
      }),
      this.prisma.protocolInvitation.findMany({
        where: { memberId: member.id, status: 'PENDING' },
        include: { invitedBy: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.protocolMembershipClaim.findMany({
        where: { memberId: member.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);

    const isProtocolMember = await this.protocolMembership.isProtocolMember(
      member.id,
    );

    return {
      spiritual: {
        verseOfDay: verseWidget,
        recentSermons: broadcasts.filter((b) => b.broadcastType === 'SERMON'),
        livestream: liveBroadcasts[0] ?? null,
        upcomingServices: occurrences,
      },
      activities: {
        upcomingEvents,
        upcomingChurchActivities: occurrences,
        announcements,
      },
      membership: {
        myChoirs: choirMemberships,
        myMinistries: ministries,
        protocolStatus: isProtocolMember ? 'ACTIVE' : 'NONE',
        pendingJoinRequests: joinRequests,
        protocolInvitations: invitations,
        protocolClaims: claims,
      },
      broadcasts,
    };
  }

  async membershipCenter(userId: string) {
    const member = await this.prisma.member.findUniqueOrThrow({
      where: { userId },
    });
    const rules = await this.choirRules.describeMembershipRules(userId);

    return {
      ...rules,
      choirs: await this.prisma.choirMembership.findMany({
        where: { userId, isActive: true },
        include: { choir: true },
      }),
      joinRequests: await this.prisma.choirJoinRequest.findMany({
        where: { memberId: member.id },
        include: { choir: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      protocolInvitations: await this.prisma.protocolInvitation.findMany({
        where: { memberId: member.id },
        orderBy: { createdAt: 'desc' },
      }),
      protocolClaims: await this.prisma.protocolMembershipClaim.findMany({
        where: { memberId: member.id },
        orderBy: { createdAt: 'desc' },
      }),
      isProtocolMember: await this.protocolMembership.isProtocolMember(member.id),
    };
  }

  async dashboardContext(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    const perms = resolved.permissions;
    const member = await this.prisma.member.findUniqueOrThrow({
      where: { userId },
    });

    const dashboards: Array<{
      key: string;
      label: string;
      path: string;
      priority: number;
    }> = [
      {
        key: 'member',
        label: 'Member',
        path: '/dashboard/member',
        priority: 10,
      },
    ];

    const choirMember = await this.prisma.choirMembership.findFirst({
      where: { userId, isActive: true },
    });
    if (choirMember) {
      dashboards.push({
        key: 'choir',
        label: 'Choir',
        path: '/dashboard/choir',
        priority: 20,
      });
    }

    if (await this.protocolMembership.isProtocolMember(member.id)) {
      dashboards.push({
        key: 'protocol',
        label: 'Protocol',
        path: '/dashboard/protocol',
        priority: 30,
      });
    }

    if (
      canAccessLeaderDashboard(perms) ||
      hasChoirOperations(perms) ||
      hasEffectivePermission(perms, PERMISSIONS.CHOIR_OPS_MANAGE)
    ) {
      dashboards.push({
        key: 'choir-leader',
        label: 'Choir Leader',
        path: '/dashboard/choir',
        priority: 40,
      });
    }

    if (
      hasProtocolOversight(perms) ||
      hasProtocolCoordination(perms) ||
      hasEffectivePermission(perms, PERMISSIONS.PROTOCOL_MANAGE)
    ) {
      dashboards.push({
        key: 'protocol-leader',
        label: 'Protocol Leader',
        path: '/dashboard/protocol',
        priority: 50,
      });
    }

    if (
      hasEffectivePermission(perms, PERMISSIONS.OPERATIONS_VIEW) ||
      hasEffectivePermission(perms, PERMISSIONS.OPERATIONS_MANAGE)
    ) {
      dashboards.push({
        key: 'operations',
        label: 'Operations',
        path: '/dashboard/operations',
        priority: 60,
      });
    }

    if (
      hasEffectivePermission(perms, PERMISSIONS.ADMIN_USERS_VIEW) ||
      hasEffectivePermission(perms, PERMISSIONS.ADMIN_AUDIT_VIEW)
    ) {
      dashboards.push({
        key: 'admin',
        label: 'Admin',
        path: '/dashboard/admin',
        priority: 100,
      });
    }

    const unique = new Map<string, (typeof dashboards)[0]>();
    for (const d of dashboards.sort((a, b) => a.priority - b.priority)) {
      if (!unique.has(d.key)) unique.set(d.key, d);
    }

    return {
      roles: resolved.roles,
      permissions: perms,
      dashboards: [...unique.values()],
      defaultDashboard: [...unique.values()][0]?.path ?? '/dashboard/member',
    };
  }
}
