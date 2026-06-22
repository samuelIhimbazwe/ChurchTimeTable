import { Injectable } from '@nestjs/common';
import { PermissionsResolver } from '../../auth/permissions.resolver';
import { PrismaService } from '../../prisma/prisma.service';
import { LEGACY_PERMISSION_ALIASES } from './capability-alias-map';
import {
  dedupeScopedCapabilities,
  can as capabilityCan,
} from './capability-can.util';
import type { ResolvedAuth, ScopedCapability } from './capability.types';
import { CHOIR_SPONSOR_CAPABILITY_IDS } from './sponsor-capability-ids';
import { ROLE_SPONSOR_CAPABILITY_BUNDLES } from './role-sponsor-capability-bundles';

@Injectable()
export class SponsorCapabilityResolverService {
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
      const bundle = ROLE_SPONSOR_CAPABILITY_BUNDLES[role];
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
        (CHOIR_SPONSOR_CAPABILITY_IDS as readonly string[]).includes(c.id),
      ),
    };
  }

  can(resolvedAuth: ResolvedAuth, capabilityId: string): boolean {
    return capabilityCan(resolvedAuth, capabilityId);
  }

  canReviewSponsor(auth: ResolvedAuth | undefined): boolean {
    if (!auth) return false;
    return (
      this.can(auth, 'choir.sponsor.review@choir')
      || this.can(auth, 'choir.member.manage@choir')
    );
  }

  private mapLegacyPermissionsToCapabilities(
    permissions: string[],
  ): ScopedCapability[] {
    const out: ScopedCapability[] = [];
    for (const perm of permissions) {
      const mapped = LEGACY_PERMISSION_ALIASES[perm];
      if (!mapped) continue;
      for (const id of mapped) {
        if (
          (CHOIR_SPONSOR_CAPABILITY_IDS as readonly string[]).includes(id)
        ) {
          out.push({ id });
        }
      }
    }
    return out;
  }

  private extractPermissionCodes(json: unknown): string[] {
    if (Array.isArray(json)) {
      return json.filter((v): v is string => typeof v === 'string');
    }
    if (json && typeof json === 'object' && 'permissions' in json) {
      const inner = (json as { permissions: unknown }).permissions;
      if (Array.isArray(inner)) {
        return inner.filter((v): v is string => typeof v === 'string');
      }
    }
    return [];
  }
}
