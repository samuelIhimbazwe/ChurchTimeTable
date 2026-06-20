import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import {
  hasChoirOperations,
  hasEffectivePermission,
} from '../common/governance/governance-permissions.util';
import { ChoirMembershipRulesService } from './choir-membership-rules.service';

export type ChoirPublicProfile = {
  summary?: string;
  featuredRelease?: {
    title: string;
    url: string;
    platform?: string;
    description?: string;
  };
  memberRecognitionEnabled?: boolean;
};

/** PATCH body — `featuredRelease: null` clears the override. */
export type ChoirPublicProfileUpdate = {
  summary?: string;
  featuredRelease?: ChoirPublicProfile['featuredRelease'] | null;
  memberRecognitionEnabled?: boolean;
};

export type UpdateChoirPublicProfileBody = {
  showMemberCountPublic?: boolean;
  publicProfile?: ChoirPublicProfileUpdate;
};

@Injectable()
export class MemberPortalChoirProfileService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
    private choirRules: ChoirMembershipRulesService,
  ) {}

  async getPublicProfile(choirId: string, actorUserId?: string) {
    if (actorUserId) {
      await this.choirRules.assertCanViewChoirInPortal(actorUserId, choirId);
    }

    const choir = await this.prisma.choir.findFirst({
      where: { id: choirId, isActive: true },
      include: {
        _count: { select: { memberships: { where: { isActive: true } } } },
        songs: {
          where: { active: true },
          orderBy: { updatedAt: 'desc' },
          take: 1,
          include: {
            assets: { where: { assetType: 'AUDIO' }, take: 1 },
          },
        },
      },
    });
    if (!choir) throw new NotFoundException('Choir not found');

    let joinStatus: string | null = null;
    let sponsorStatus: string | null = null;
    let isSponsor = false;
    let pendingSponsorRequestId: string | null = null;
    if (actorUserId) {
      const member = await this.prisma.member.findUnique({
        where: { userId: actorUserId },
        select: { id: true },
      });
      if (member) {
        const [joinReq, sponsorReq, sponsorship] = await Promise.all([
          this.prisma.choirJoinRequest.findFirst({
            where: { memberId: member.id, choirId },
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.choirSponsorRequest.findFirst({
            where: { memberId: member.id, choirId },
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.choirSponsorship.findFirst({
            where: { memberId: member.id, choirId, active: true },
          }),
        ]);
        joinStatus = joinReq?.status ?? null;
        sponsorStatus = sponsorReq?.status ?? null;
        isSponsor = Boolean(sponsorship);
        pendingSponsorRequestId =
          sponsorReq?.status === 'PENDING' ? sponsorReq.id : null;
      }
    }

    const profile = this.parseProfile(choir.publicProfileJson);
    const latestSong = choir.songs[0];
    const featuredRelease =
      profile.featuredRelease ??
      (latestSong
        ? {
            title: latestSong.title,
            url: latestSong.assets[0]?.fileUrl ?? '',
            platform: 'other',
            description: latestSong.notes ?? undefined,
          }
        : undefined);

    return {
      id: choir.id,
      name: choir.name,
      code: choir.code,
      description: choir.description,
      choirKind: choir.choirKind,
      leader: choir.leaderDisplayName,
      isPublicJoinable: choir.isPublicJoinable,
      showMemberCount: choir.showMemberCountPublic,
      memberCount: choir.showMemberCountPublic
        ? choir._count.memberships
        : undefined,
      publicSummary: profile.summary ?? choir.description,
      profileSummary: profile.summary ?? null,
      featuredReleaseOverride: profile.featuredRelease ?? null,
      memberRecognitionEnabled: profile.memberRecognitionEnabled !== false,
      featuredRelease: featuredRelease?.url ? featuredRelease : null,
      joinStatus,
      sponsorStatus,
      isSponsor,
      pendingSponsorRequestId,
    };
  }

  async updatePublicProfile(
    actorUserId: string,
    choirId: string,
    body: UpdateChoirPublicProfileBody,
  ) {
    await this.assertCanManage(actorUserId, choirId);

    const existing = await this.prisma.choir.findUnique({ where: { id: choirId } });
    if (!existing) throw new NotFoundException('Choir not found');

    const merged: ChoirPublicProfile = {
      ...this.parseProfile(existing.publicProfileJson),
    };
    if (body.publicProfile) {
      if (body.publicProfile.summary !== undefined) {
        merged.summary = body.publicProfile.summary;
      }
      if ('featuredRelease' in body.publicProfile) {
        if (body.publicProfile.featuredRelease === null) {
          delete merged.featuredRelease;
        } else if (body.publicProfile.featuredRelease) {
          merged.featuredRelease = body.publicProfile.featuredRelease;
        }
      }
      if (body.publicProfile.memberRecognitionEnabled !== undefined) {
        merged.memberRecognitionEnabled = body.publicProfile.memberRecognitionEnabled;
      }
    }

    return this.prisma.choir.update({
      where: { id: choirId },
      data: {
        ...(body.showMemberCountPublic !== undefined
          ? { showMemberCountPublic: body.showMemberCountPublic }
          : {}),
        publicProfileJson: merged as object,
      },
      select: {
        id: true,
        showMemberCountPublic: true,
        publicProfileJson: true,
      },
    });
  }

  private parseProfile(raw: unknown): ChoirPublicProfile {
    if (!raw || typeof raw !== 'object') return {};
    const o = raw as Record<string, unknown>;
    const fr = o.featuredRelease as Record<string, unknown> | undefined;
    return {
      summary: typeof o.summary === 'string' ? o.summary : undefined,
      memberRecognitionEnabled:
        typeof o.memberRecognitionEnabled === 'boolean'
          ? o.memberRecognitionEnabled
          : undefined,
      featuredRelease:
        fr && typeof fr.title === 'string' && typeof fr.url === 'string'
          ? {
              title: fr.title,
              url: fr.url,
              platform: typeof fr.platform === 'string' ? fr.platform : undefined,
              description:
                typeof fr.description === 'string' ? fr.description : undefined,
            }
          : undefined,
    };
  }

  private async assertCanManage(userId: string, choirId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    const perms = resolved.permissions;
    if (
      hasChoirOperations(perms) ||
      hasEffectivePermission(perms, PERMISSIONS.CHOIR_OPS_MANAGE) ||
      hasEffectivePermission(perms, PERMISSIONS.ADMIN_USERS_MANAGE)
    ) {
      return;
    }
    const member = await this.prisma.member.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (member) {
      const committee = await this.prisma.choirCommitteeMember.findFirst({
        where: { memberId: member.id, choirId },
      });
      if (committee) return;
    }
    throw new ForbiddenException('Cannot update choir public profile');
  }
}
