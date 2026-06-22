import { Injectable } from '@nestjs/common';
import { PermissionsResolver } from '../../auth/permissions.resolver';
import { PrismaService } from '../../prisma/prisma.service';
import { LEGACY_PERMISSION_ALIASES } from './capability-alias-map';
import {
  dedupeScopedCapabilities,
  can as capabilityCan,
} from './capability-can.util';
import type { ResolvedAuth, ScopedCapability } from './capability.types';
import { CHOIR_COMMS_CAPABILITY_IDS } from './comms-capability-ids';
import { ROLE_COMMS_CAPABILITY_BUNDLES } from './role-comms-capability-bundles';

@Injectable()
export class CommsCapabilityResolverService {
  constructor(
    private prisma: PrismaService,
    private permissionsResolver: PermissionsResolver,
  ) {}

  async resolveGrantsToCapabilities(
    userId: string,
    choirId: string,
  ): Promise<ResolvedAuth> {
    const resolved = await this.permissionsResolver.resolveForUser(userId);
    const caps: ScopedCapability[] = [];

    for (const role of resolved.roles) {
      const bundle = ROLE_COMMS_CAPABILITY_BUNDLES[role];
      if (!bundle) continue;
      for (const id of bundle) {
        caps.push({ id });
      }
    }

    if (resolved.memberId) {
      const now = new Date();
      const committeeSeats = await this.prisma.choirCommitteeMember.findMany({
        where: {
          choirId,
          memberId: resolved.memberId,
          OR: [{ effectiveEnd: null }, { effectiveEnd: { gt: now } }],
        },
        include: { role: { select: { permissionsJson: true } } },
      });

      for (const seat of committeeSeats) {
        const perms = this.extractPermissionCodes(seat.role.permissionsJson);
        caps.push(...this.mapLegacyPermissionsToCapabilities(perms));
      }

      const elevations = await this.prisma.choirAdvisorElevation.findMany({
        where: {
          choirId,
          memberId: resolved.memberId,
          revokedAt: null,
          startsAt: { lte: now },
          endsAt: { gt: now },
        },
      });

      for (const elevation of elevations) {
        const perms = this.extractPermissionCodes(elevation.permissionsJson);
        caps.push(...this.mapLegacyPermissionsToCapabilities(perms));
      }
    }

    caps.push(
      ...this.mapLegacyPermissionsToCapabilities(resolved.permissions),
    );

    return {
      userId,
      choirId,
      capabilities: dedupeScopedCapabilities(caps).filter((c) =>
        (CHOIR_COMMS_CAPABILITY_IDS as readonly string[]).includes(c.id),
      ),
    };
  }

  can(resolvedAuth: ResolvedAuth, capabilityId: string): boolean {
    return capabilityCan(resolvedAuth, capabilityId);
  }

  canViewAnnouncements(auth: ResolvedAuth | undefined): boolean {
    if (!auth) return false;
    return (
      this.can(auth, 'choir.announcement.view@choir')
      || this.can(auth, 'choir.announcement.manage@choir')
    );
  }

  canManageAnnouncements(auth: ResolvedAuth | undefined): boolean {
    if (!auth) return false;
    return this.can(auth, 'choir.announcement.manage@choir');
  }

  canViewMeetings(auth: ResolvedAuth | undefined): boolean {
    if (!auth) return false;
    return (
      this.can(auth, 'choir.meeting.view@choir')
      || this.can(auth, 'choir.meeting.manage@choir')
    );
  }

  canManageMeetings(auth: ResolvedAuth | undefined): boolean {
    if (!auth) return false;
    return this.can(auth, 'choir.meeting.manage@choir');
  }

  private mapLegacyPermissionsToCapabilities(
    permissions: string[],
  ): ScopedCapability[] {
    const out: ScopedCapability[] = [];
    for (const perm of permissions) {
      const mapped = LEGACY_PERMISSION_ALIASES[perm];
      if (!mapped) continue;
      for (const id of mapped) {
        if ((CHOIR_COMMS_CAPABILITY_IDS as readonly string[]).includes(id)) {
          out.push({ id });
        }
      }
    }
    return out;
  }

  private extractPermissionCodes(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
  }
}
