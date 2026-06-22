import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FamilyMemberRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { ROLES } from '../common/constants/roles';
import { ChoirMembershipRulesService } from './choir-membership-rules.service';
import { ContributionCapabilityResolverService } from '../common/choir/contribution-capability-resolver.service';
import { WelfareCapabilityResolverService } from '../common/choir/welfare-capability-resolver.service';
import { DisciplineCapabilityResolverService } from '../common/choir/discipline-capability-resolver.service';
import { OpsCapabilityResolverService } from '../common/choir/ops-capability-resolver.service';
import { JoinCapabilityResolverService } from '../common/choir/join-capability-resolver.service';
import { SponsorCapabilityResolverService } from '../common/choir/sponsor-capability-resolver.service';
import { MusicCapabilityResolverService } from '../common/choir/music-capability-resolver.service';
import { RosterCapabilityResolverService } from '../common/choir/roster-capability-resolver.service';
import { CommsCapabilityResolverService } from '../common/choir/comms-capability-resolver.service';
import { VoiceCapabilityResolverService } from '../common/choir/voice-capability-resolver.service';
import { LogisticsCapabilityResolverService } from '../common/choir/logistics-capability-resolver.service';
import type { ResolvedAuth } from '../common/choir/capability.types';
import {
  inferCommitteeRoleKeys,
  isChoirScopedDashboardPermission,
  resolveChoirLandingPath,
} from './choir-officer-roles.util';

const CHOIR_ADMIN_OVERRIDE_ROLES = new Set<string>([
  ROLES.SUPER_ADMIN,
  ROLES.CHURCH_ADMIN,
  ROLES.CHOIR_ADMIN,
]);

/** Every approved choir member gets these capabilities in their choir dashboard. */
const MEMBER_BASELINE_PERMISSIONS = [
  'member.portal.view',
  'event:read',
  'choir.music.view',
  'choir.rehearsal.view',
  'choir.contribution.submit',
] as const;

const FAMILY_LEADERSHIP_ROLES: FamilyMemberRole[] = [
  FamilyMemberRole.HEAD,
  FamilyMemberRole.ASSISTANT_HEAD,
  FamilyMemberRole.SECRETARY,
];

const FAMILY_OFFICE_META: Record<
  'HEAD' | 'ASSISTANT_HEAD' | 'SECRETARY',
  { segment: string; label: string }
> = {
  HEAD: { segment: 'family-leadership', label: 'Family leadership' },
  ASSISTANT_HEAD: { segment: 'family-deputy', label: 'Family deputy' },
  SECRETARY: { segment: 'family-coordination', label: 'Family coordination' },
};

export type ChoirDashboardPosition = {
  roleKey: string;
  roleName: string;
  permissions: string[];
};

export type ChoirFamilyOffice = {
  role: FamilyMemberRole;
  familyId: string;
  familyName: string;
  officePath: string;
  label: string;
};

export type ChoirCustomRoleAssignment = {
  id: string;
  customRoleId: string;
  name: string;
  description: string | null;
  permissions: string[];
};

export type ChoirDashboardContext = {
  choir: {
    id: string;
    name: string;
    code: string;
    choirKind: string;
  };
  membership: {
    role: string;
    isActive: true;
  } | null;
  positions: ChoirDashboardPosition[];
  permissions: string[];
  landingPath: string;
  canAccess: boolean;
  familyOffices: ChoirFamilyOffice[];
  customRoles: ChoirCustomRoleAssignment[];
  presidentDelegation: {
    outOfOffice: boolean;
    joinReview: boolean;
  };
  contributionAuth: ResolvedAuth;
  welfareAuth: ResolvedAuth;
  disciplineAuth: ResolvedAuth;
  opsAuth: ResolvedAuth;
  joinAuth: ResolvedAuth;
  sponsorAuth: ResolvedAuth;
  musicAuth: ResolvedAuth;
  rosterAuth: ResolvedAuth;
  commsAuth: ResolvedAuth;
  voiceAuth: ResolvedAuth;
  logisticsAuth: ResolvedAuth;
};

@Injectable()
export class ChoirDashboardContextService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
    private choirRules: ChoirMembershipRulesService,
    private contributionCapabilities: ContributionCapabilityResolverService,
    private welfareCapabilities: WelfareCapabilityResolverService,
    private disciplineCapabilities: DisciplineCapabilityResolverService,
    private opsCapabilities: OpsCapabilityResolverService,
    private joinCapabilities: JoinCapabilityResolverService,
    private sponsorCapabilities: SponsorCapabilityResolverService,
    private musicCapabilities: MusicCapabilityResolverService,
    private rosterCapabilities: RosterCapabilityResolverService,
    private commsCapabilities: CommsCapabilityResolverService,
    private voiceCapabilities: VoiceCapabilityResolverService,
    private logisticsCapabilities: LogisticsCapabilityResolverService,
  ) {}

  async getContext(userId: string, choirId: string): Promise<ChoirDashboardContext> {
    const choir = await this.prisma.choir.findFirst({
      where: { id: choirId, isActive: true },
      select: { id: true, name: true, code: true, choirKind: true,
        presidentOutOfOffice: true,
        presidentDelegationJoinReview: true,
      },
    });
    if (!choir) {
      throw new NotFoundException('Choir not found');
    }

    const resolved = await this.permissions.resolveForUser(userId);
    const isAdminOverride = resolved.roles.some((r) =>
      CHOIR_ADMIN_OVERRIDE_ROLES.has(r),
    );

    const membership = await this.prisma.choirMembership.findUnique({
      where: { userId_choirId: { userId, choirId } },
    });

    const isActiveMember = membership?.isActive === true;
    const canViewInPortal = await this.choirRules.canViewChoirInPortal(
      userId,
      choirId,
    );

    if (!isAdminOverride && !isActiveMember) {
      throw new ForbiddenException('Not a member of this choir');
    }

    const member = resolved.memberId
      ? await this.prisma.member.findUnique({
          where: { id: resolved.memberId },
          select: { id: true },
        })
      : null;

    const committeeRows = member
      ? await this.prisma.choirCommitteeMember.findMany({
          where: { memberId: member.id, choirId },
          include: { role: true },
        })
      : [];

    const positions: ChoirDashboardPosition[] = committeeRows.map((row) => ({
      roleKey: row.role.name,
      roleName: formatCommitteeRoleName(row.role.name),
      permissions: parsePermissionsJson(row.role.permissionsJson),
    }));

    const assignedKeys = new Set(positions.map((p) => p.roleKey));
    const inferredKeys = inferCommitteeRoleKeys(
      resolved.roles,
      membership?.role,
    );

    for (const roleKey of inferredKeys) {
      if (assignedKeys.has(roleKey)) continue;
      const committeeRole = await this.prisma.choirCommitteeRole.findUnique({
        where: { choirId_name: { choirId, name: roleKey } },
      });
      positions.push({
        roleKey,
        roleName: formatCommitteeRoleName(roleKey),
        permissions: parsePermissionsJson(committeeRole?.permissionsJson),
      });
      assignedKeys.add(roleKey);
    }

    const permissionSet = new Set<string>(MEMBER_BASELINE_PERMISSIONS);

    if (isActiveMember) {
      for (const position of positions) {
        for (const perm of position.permissions) {
          permissionSet.add(perm);
        }
      }
      for (const perm of resolved.permissions) {
        if (isChoirScopedDashboardPermission(perm)) {
          permissionSet.add(perm);
        }
      }
    }

    if (isAdminOverride) {
      for (const perm of resolved.permissions) {
        if (
          perm.startsWith('choir.') ||
          perm.startsWith('member') ||
          perm.startsWith('event:') ||
          perm.startsWith('discipline:') ||
          perm.startsWith('family:') ||
          perm.startsWith('audit:') ||
          perm.startsWith('report')
        ) {
          permissionSet.add(perm);
        }
      }
    }

    const scopedPrefix = `committee:choir:${choirId}:`;
    for (const perm of resolved.permissions) {
      if (perm.startsWith(scopedPrefix)) {
        permissionSet.add(perm.slice(scopedPrefix.length));
      }
    }

    const familyOffices: ChoirFamilyOffice[] = member
      ? (
          await this.prisma.familyMember.findMany({
            where: {
              memberId: member.id,
              role: { in: FAMILY_LEADERSHIP_ROLES },
              family: { choirId },
            },
            include: {
              family: { select: { id: true, familyName: true } },
            },
          })
        ).map((row) => {
          const meta = FAMILY_OFFICE_META[row.role as keyof typeof FAMILY_OFFICE_META];
          return {
            role: row.role,
            familyId: row.familyId,
            familyName: row.family.familyName,
            officePath: `/choir/${choirId}/${meta.segment}`,
            label: meta.label,
          };
        })
      : [];

    const customRoleRows = member
      ? await this.prisma.choirMemberCustomRole.findMany({
          where: { memberId: member.id, choirId },
          include: {
            customRole: { include: { permissions: true } },
          },
        })
      : [];

    const customRoles: ChoirCustomRoleAssignment[] = customRoleRows
      .filter((row) => row.customRole.isActive)
      .map((row) => ({
        id: row.id,
        customRoleId: row.customRoleId,
        name: row.customRole.name,
        description: row.customRole.description,
        permissions: row.customRole.permissions.map((p) => p.permission),
      }));

    for (const assignment of customRoles) {
      for (const perm of assignment.permissions) {
        if (isChoirScopedDashboardPermission(perm)) {
          permissionSet.add(perm);
        }
      }
    }

    const contributionAuth =
      await this.contributionCapabilities.resolveGrantsToCapabilities(
        userId,
        choirId,
      );

    const welfareAuth =
      await this.welfareCapabilities.resolveGrantsToCapabilities(
        userId,
        choirId,
      );

    const disciplineAuth =
      await this.disciplineCapabilities.resolveGrantsToCapabilities(
        userId,
        choirId,
      );

    const opsAuth =
      await this.opsCapabilities.resolveGrantsToCapabilities(
        userId,
        choirId,
      );

    const joinAuth =
      await this.joinCapabilities.resolveGrantsToCapabilities(
        userId,
        choirId,
      );

    const sponsorAuth =
      await this.sponsorCapabilities.resolveGrantsToCapabilities(
        userId,
        choirId,
      );

    const musicAuth =
      await this.musicCapabilities.resolveGrantsToCapabilities(
        userId,
        choirId,
      );

    const rosterAuth =
      await this.rosterCapabilities.resolveGrantsToCapabilities(
        userId,
        choirId,
      );

    const commsAuth =
      await this.commsCapabilities.resolveGrantsToCapabilities(
        userId,
        choirId,
      );

    const voiceAuth =
      await this.voiceCapabilities.resolveGrantsToCapabilities(
        userId,
        choirId,
      );

    const logisticsAuth =
      await this.logisticsCapabilities.resolveGrantsToCapabilities(
        userId,
        choirId,
      );

    return {
      choir: {
        id: choir.id,
        name: choir.name,
        code: choir.code,
        choirKind: choir.choirKind,
      },
      membership: isActiveMember
        ? { role: membership!.role, isActive: true as const }
        : null,
      positions,
      permissions: [...permissionSet],
      landingPath: resolveChoirLandingPath(choirId, positions),
      canAccess: isAdminOverride || isActiveMember || canViewInPortal,
      familyOffices,
      customRoles,
      presidentDelegation: {
        outOfOffice: choir.presidentOutOfOffice,
        joinReview: choir.presidentDelegationJoinReview,
      },
      contributionAuth,
      welfareAuth,
      disciplineAuth,
      opsAuth,
      joinAuth,
      sponsorAuth,
      musicAuth,
      rosterAuth,
      commsAuth,
      voiceAuth,
      logisticsAuth,
    };
  }
}

function parsePermissionsJson(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function formatCommitteeRoleName(key: string): string {
  return key
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
