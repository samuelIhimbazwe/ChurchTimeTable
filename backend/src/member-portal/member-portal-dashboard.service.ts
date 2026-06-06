import { Injectable } from '@nestjs/common';
import { MemberStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { ProtocolMembershipService } from './protocol-membership.service';
import { MAIN_CHOIR_ID } from '../common/constants/choir.constants';
import { DevotionType } from '@prisma/client';
import { ChoirMembershipRulesService } from './choir-membership-rules.service';
import { ChoirDiscoveryService } from './choir-discovery.service';
import { MemberPortalDevotionService } from './member-portal-devotion.service';
import { MemberPortalWeeklyActivitiesService } from './member-portal-weekly-activities.service';
import {
  ChurchBrandingService,
  ChurchStreamingSettings,
} from '../auth-ux/church-branding.service';
import { SYSTEM_OPERATION_TEMPLATES } from '../operations/operations.constants';
import { CHURCH_MINISTRY_CODE } from '../ministries/ministry.constants';
import {
  canAccessLeaderDashboard,
  hasChoirOperations,
  hasEffectivePermission,
  hasProtocolCoordination,
  hasProtocolOversight,
} from '../common/governance/governance-permissions.util';
import { PERMISSIONS } from '../common/constants/roles';

const CORE_SERVICE_CODES = [
  'SUNDAY_SERVICE_1',
  'SUNDAY_SERVICE_2',
  'TUESDAY_SERVICE',
  'IGABURO',
] as const;

const FEATURED_MINISTRY_CODES = ['MUSIC', 'DEACONS'] as const;

type OccurrenceRow = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  type: string;
  template: { code: string; name: string } | null;
};

@Injectable()
export class MemberPortalDashboardService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
    private protocolMembership: ProtocolMembershipService,
    private choirRules: ChoirMembershipRulesService,
    private branding: ChurchBrandingService,
    private choirDiscovery: ChoirDiscoveryService,
    private portalDevotion: MemberPortalDevotionService,
    private portalWeekly: MemberPortalWeeklyActivitiesService,
  ) {}

  async churchMemberDashboard(userId: string) {
    const member = await this.prisma.member.findUniqueOrThrow({
      where: { userId },
    });
    const now = new Date();
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);

    const branding = await this.branding.getPublicBranding();

    const [
      verseWidget,
      choirAnnouncements,
      churchMinistry,
      broadcasts,
      liveBroadcasts,
      upcomingOccurrences,
      choirMemberships,
      ministryMemberships,
      joinRequests,
      invitations,
      claims,
      publicChoirs,
      featuredMinistries,
      weeklyMeetings,
    ] = await Promise.all([
      this.prisma.devotion.findFirst({
        where: {
          type: DevotionType.VERSE_OF_DAY,
          publishedAt: { lte: now },
          OR: [{ choirId: MAIN_CHOIR_ID }, { choirId: null }],
        },
        orderBy: { publishedAt: 'desc' },
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
      this.prisma.ministry.findUnique({
        where: { code: CHURCH_MINISTRY_CODE },
        select: { id: true },
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
        take: 40,
        select: {
          id: true,
          title: true,
          startAt: true,
          endAt: true,
          type: true,
          template: { select: { code: true, name: true } },
        },
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
        include: { choir: { select: { id: true, name: true } } },
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
      this.choirDiscovery.listPublic(userId),
      this.prisma.ministry.findMany({
        where: {
          isActive: true,
          code: { in: [...FEATURED_MINISTRY_CODES] },
        },
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { memberships: { where: { status: 'ACTIVE' } } } },
        },
      }),
      this.prisma.ministryMeeting.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: { gte: now, lte: in30 },
          ministry: { isActive: true },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 8,
        include: {
          ministry: { select: { name: true, code: true } },
        },
      }),
    ]);

    const churchAnnouncements = churchMinistry
      ? await this.prisma.ministryAnnouncement.findMany({
          where: {
            ministryId: churchMinistry.id,
            isActive: true,
            publishedAt: { lte: now, not: null },
            OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
          },
          orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
          take: 5,
          select: {
            id: true,
            title: true,
            content: true,
            publishedAt: true,
            isPinned: true,
          },
        })
      : [];

    const isProtocolMember = await this.protocolMembership.isProtocolMember(
      member.id,
    );

    const activeMemberIds = new Set(
      ministryMemberships.map((m) => m.ministry.code),
    );

    const services = this.buildServiceCards(
      upcomingOccurrences,
      liveBroadcasts,
      branding.streaming,
    );

    const events = upcomingOccurrences
      .filter((o) => {
        const code = o.template?.code;
        if (code && (CORE_SERVICE_CODES as readonly string[]).includes(code)) {
          return false;
        }
        return o.type === 'SPECIAL_EVENT' || !code;
      })
      .slice(0, 8)
      .map((o) => this.serializeOccurrence(o));

    const weeklyActivities = weeklyMeetings.map((m) => ({
      id: m.id,
      title: m.title,
      startAt: m.scheduledAt.toISOString(),
      location: m.location,
      ministryName: m.ministry.name,
      ministryCode: m.ministry.code,
      source: 'ministry' as const,
    }));

    const announcements = [
      ...churchAnnouncements.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.content,
        publishedAt: a.publishedAt?.toISOString() ?? null,
        pinned: a.isPinned,
        source: 'church' as const,
      })),
      ...choirAnnouncements.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        publishedAt: a.publishedAt?.toISOString() ?? null,
        pinned: false,
        source: 'choir' as const,
      })),
    ]
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return (
          new Date(b.publishedAt ?? 0).getTime() -
          new Date(a.publishedAt ?? 0).getTime()
        );
      })
      .slice(0, 8);

    const liveBroadcast = liveBroadcasts[0] ?? null;
    const pendingClaim = claims.find((c) => c.status === 'PENDING');

    const [prayWithUs, weeklyActivitiesPreview] = await Promise.all([
      this.portalDevotion.portalPrayPreview(),
      this.portalWeekly.nearestDayPreview(),
    ]);

    const welcome = {
      displayName: `${member.firstName} ${member.lastName}`.trim(),
      firstName: member.firstName,
      lastName: member.lastName,
      churchName: branding.churchName,
      welcomeMessage: branding.welcomeMessage,
      onboardingCompleted: member.onboardingCompleted,
      memberStatus: member.status,
      pendingApproval: member.status === MemberStatus.NEW_MEMBER,
    };

    const protocol = {
      status: isProtocolMember
        ? ('ACTIVE' as const)
        : pendingClaim
          ? ('PENDING_CLAIM' as const)
          : invitations.length
            ? ('PENDING_INVITATION' as const)
            : ('NONE' as const),
      isMember: isProtocolMember,
      canClaim: !isProtocolMember && !pendingClaim,
      pendingClaim: pendingClaim
        ? {
            id: pendingClaim.id,
            status: pendingClaim.status,
            createdAt: pendingClaim.createdAt.toISOString(),
          }
        : null,
      pendingInvitations: invitations.map((i) => ({
        id: i.id,
        invitedBy: i.invitedBy
          ? `${i.invitedBy.firstName} ${i.invitedBy.lastName}`.trim()
          : null,
      })),
      description:
        'Protocol serves with hospitality — welcoming guests and coordinating order during church services.',
    };

    const ministries = featuredMinistries.map((m) => ({
      id: m.id,
      name: m.name,
      code: m.code,
      description: m.description,
      memberCount: m._count.memberships,
      isMember: activeMemberIds.has(m.code),
    }));

    const membership = {
      myChoirs: choirMemberships,
      myMinistries: ministryMemberships,
      protocolStatus: isProtocolMember ? 'ACTIVE' : 'NONE',
      pendingJoinRequests: joinRequests,
      protocolInvitations: invitations,
      protocolClaims: claims,
    };

    const spiritual = {
      verseOfDay: verseWidget,
      recentSermons: broadcasts.filter((b) => b.broadcastType === 'SERMON'),
      livestream: liveBroadcast,
      upcomingServices: upcomingOccurrences.slice(0, 5).map((o) =>
        this.serializeOccurrence(o),
      ),
    };

    const activities = {
      upcomingEvents: events,
      upcomingChurchActivities: weeklyActivities,
      announcements,
    };

    return {
      welcome,
      location: branding.location,
      streaming: branding.streaming,
      onboarding: {
        completed: member.onboardingCompleted,
        showPrompt: !member.onboardingCompleted,
      },
      spiritual,
      prayWithUs,
      services,
      events,
      weeklyActivitiesPreview,
      weeklyActivities,
      ministries,
      choirs: publicChoirs,
      protocol,
      announcements,
      liveBroadcast,
      membership,
      activities,
      broadcasts,
    };
  }

  private buildServiceCards(
    occurrences: OccurrenceRow[],
    liveBroadcasts: Array<{ youtubeUrl: string; isLive: boolean }>,
    streaming: ChurchStreamingSettings,
  ) {
    const liveUrl = liveBroadcasts.find((b) => b.isLive)?.youtubeUrl ?? null;
    const fallbackUrl = streaming.defaultLiveStreamUrl;

    return SYSTEM_OPERATION_TEMPLATES.filter((t) =>
      (CORE_SERVICE_CODES as readonly string[]).includes(t.code),
    ).map((template) => {
      const next = occurrences.find((o) => o.template?.code === template.code);
      const isIgaburo = template.code === 'IGABURO';
      const streamAllowed = !isIgaburo || streaming.igaburoLiveStreamEnabled;
      let liveStreamUrl: string | null = null;
      if (streamAllowed) {
        liveStreamUrl = liveUrl ?? fallbackUrl;
      }

      return {
        code: template.code,
        name: template.name,
        description: template.description,
        nextOccurrence: next ? this.serializeOccurrence(next) : null,
        liveStreamUrl,
        liveStreamRestricted: isIgaburo && !streaming.igaburoLiveStreamEnabled,
        restrictionReason: isIgaburo
          ? streaming.igaburoLiveStreamEnabled
            ? null
            : 'Igaburo is for baptised members in person; live stream is not offered unless church leadership enables it.'
          : null,
      };
    });
  }

  private serializeOccurrence(o: OccurrenceRow) {
    return {
      id: o.id,
      title: o.title,
      startAt: o.startAt.toISOString(),
      endAt: o.endAt.toISOString(),
      type: o.type,
      templateCode: o.template?.code ?? null,
      templateName: o.template?.name ?? null,
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
        path: '/portal',
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
        path: '/choir',
        priority: 20,
      });
    }

    if (await this.protocolMembership.isProtocolMember(member.id)) {
      dashboards.push({
        key: 'protocol',
        label: 'Protocol',
        path: '/protocol',
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
        path: '/choir',
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
        path: '/protocol',
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
        path: '/admin',
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
      defaultDashboard: [...unique.values()][0]?.path ?? '/portal',
    };
  }
}
