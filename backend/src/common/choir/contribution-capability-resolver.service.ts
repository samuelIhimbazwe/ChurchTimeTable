import { Injectable } from '@nestjs/common';
import { FamilyMemberRole } from '@prisma/client';
import { PermissionsResolver } from '../../auth/permissions.resolver';
import { PrismaService } from '../../prisma/prisma.service';
import { hasEffectivePermission } from '../governance/governance-permissions.util';
import { LEGACY_PERMISSION_ALIASES } from './capability-alias-map';
import {
  dedupeScopedCapabilities,
  can as capabilityCan,
} from './capability-can.util';
import type { ResolvedAuth, ScopedCapability } from './capability.types';
import { CHOIR_CONTRIBUTION_CAPABILITY_IDS } from './contribution-capability-ids';
import { ROLE_CONTRIBUTION_CAPABILITY_BUNDLES } from './role-contribution-capability-bundles';

const FAMILY_HEAD_CAPABILITIES = [
  'choir.contribution.view@family',
  'choir.contribution.approve@family',
  'choir.contribution.adjust@family',
] as const;

const FAMILY_ASSISTANT_CAPABILITIES = [
  'choir.contribution.view@family',
] as const;

const FAMILY_ASSISTANT_DELEGATED_CAPABILITIES = [
  'choir.contribution.view@family',
  'choir.contribution.approve@family',
] as const;

const FAMILY_SECRETARY_CAPABILITIES = ['choir.contribution.view@family'] as const;

@Injectable()
export class ContributionCapabilityResolverService {
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

    // 1) Role bundles
    for (const role of resolved.roles) {
      const bundle = ROLE_CONTRIBUTION_CAPABILITY_BUNDLES[role];
      if (!bundle) continue;
      for (const id of bundle) {
        caps.push({ id });
      }
    }

    // 2) Office grants (family membership in this choir)
    if (resolved.memberId) {
      const familyRows = await this.prisma.familyMember.findMany({
        where: {
          memberId: resolved.memberId,
          family: { choirId },
        },
        include: {
          family: { select: { id: true, delegationEnabled: true } },
        },
      });

      for (const row of familyRows) {
        const familyId = row.familyId;
        if (row.role === FamilyMemberRole.HEAD) {
          for (const id of FAMILY_HEAD_CAPABILITIES) {
            caps.push({ id, scopeId: familyId });
          }
        } else if (row.role === FamilyMemberRole.ASSISTANT_HEAD) {
          const delegated = row.family.delegationEnabled;
          const set = delegated
            ? FAMILY_ASSISTANT_DELEGATED_CAPABILITIES
            : FAMILY_ASSISTANT_CAPABILITIES;
          for (const id of set) {
            caps.push({ id, scopeId: familyId });
          }
        } else if (row.role === FamilyMemberRole.SECRETARY) {
          for (const id of FAMILY_SECRETARY_CAPABILITIES) {
            caps.push({ id, scopeId: familyId });
          }
        }
      }
    }

    // 3) Acting seats — committee assignments with effectiveEnd
    if (resolved.memberId) {
      const now = new Date();
      const committeeSeats = await this.prisma.choirCommitteeMember.findMany({
        where: {
          choirId,
          memberId: resolved.memberId,
          OR: [{ effectiveEnd: null }, { effectiveEnd: { gt: now } }],
        },
        include: { role: { select: { permissionsJson: true, id: true } } },
      });

      for (const seat of committeeSeats) {
        const perms = this.extractPermissionCodes(seat.role.permissionsJson);
        caps.push(
          ...this.mapLegacyPermissionsToCapabilities(perms, {
            type: 'committee_seat',
            id: seat.id,
          }),
        );
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
        caps.push(
          ...this.mapLegacyPermissionsToCapabilities(perms, {
            type: 'acting_seat',
            id: elevation.id,
          }),
        );
      }
    }

    // 4) Explicit legacy permissions → capability aliases
    caps.push(
      ...this.mapLegacyPermissionsToCapabilities(resolved.permissions),
    );

    // Baseline: any active member with memberId gets view@self (matches canViewOwn)
    const choirMembership = await this.prisma.choirMembership.findFirst({
      where: { choirId, userId, isActive: true },
      select: { id: true },
    });
    if (choirMembership) {
        caps.push({ id: 'choir.contribution.view@self' });
      if (
        hasEffectivePermission(
          resolved.permissions,
          'choir.contribution.submit',
        )
      ) {
        caps.push({ id: 'choir.contribution.submit@self' });
      }
    }

    return {
      userId,
      choirId,
      capabilities: dedupeScopedCapabilities(caps).filter((c) =>
        (CHOIR_CONTRIBUTION_CAPABILITY_IDS as readonly string[]).includes(c.id),
      ),
    };
  }

  can(
    resolvedAuth: ResolvedAuth,
    capabilityId: string,
    scopeId?: string,
  ): boolean {
    return capabilityCan(resolvedAuth, capabilityId, scopeId);
  }

  private mapLegacyPermissionsToCapabilities(
    permissions: string[],
    _sourceRef?: { type: string; id: string },
  ): ScopedCapability[] {
    const out: ScopedCapability[] = [];
    for (const perm of permissions) {
      const mapped = LEGACY_PERMISSION_ALIASES[perm];
      if (!mapped) continue;
      for (const id of mapped) {
        out.push({ id });
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
