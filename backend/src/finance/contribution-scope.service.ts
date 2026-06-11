import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ContributionTotalsQuery, ContributionTotalsScope } from './contribution-totals.types';
import { FamilyMemberRole } from '@prisma/client';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS, ROLES } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { PrismaService } from '../prisma/prisma.service';
import type {
  ContributionActorContext,
  ContributionActorRoleSnapshot,
  FamilyMembershipContext,
} from './contribution-scope.types';

const LEADERSHIP_ROLES: FamilyMemberRole[] = [
  FamilyMemberRole.HEAD,
  FamilyMemberRole.ASSISTANT_HEAD,
  FamilyMemberRole.SECRETARY,
];

const FAMILY_RANKING_ROLES: FamilyMemberRole[] = [
  FamilyMemberRole.HEAD,
  FamilyMemberRole.ASSISTANT_HEAD,
];

const MINISTRY_CONTRIBUTION_PERMISSIONS = [
  PERMISSIONS.CHOIR_CONTRIBUTION_SUBMIT,
  PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_FAMILY,
  PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
  PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
  PERMISSIONS.CHOIR_CONTRIBUTION_TYPE_MANAGE,
  PERMISSIONS.CHOIR_CONTRIBUTION_CAMPAIGN_MANAGE,
  PERMISSIONS.PROTOCOL_CONTRIBUTION_SUBMIT,
  PERMISSIONS.PROTOCOL_CONTRIBUTION_VIEW_ALL,
  PERMISSIONS.PROTOCOL_CONTRIBUTION_ADJUST,
  PERMISSIONS.CHOIR_FINANCE_VIEW,
  PERMISSIONS.CHOIR_FINANCE_MANAGE,
  PERMISSIONS.CHOIR_FINANCE_APPROVE,
  PERMISSIONS.PROTOCOL_FINANCE_VIEW,
  PERMISSIONS.PROTOCOL_FINANCE_MANAGE,
  PERMISSIONS.PROTOCOL_FINANCE_APPROVE,
  PERMISSIONS.CHOIR_FAMILY_VIEW,
  PERMISSIONS.CHOIR_FAMILY_MANAGE,
  PERMISSIONS.FAMILY_VIEW,
  PERMISSIONS.FAMILY_MANAGE,
] as const;

@Injectable()
export class ContributionScopeService {
  constructor(
    private prisma: PrismaService,
    private permissionsResolver: PermissionsResolver,
  ) {}

  async resolveActor(userId: string): Promise<ContributionActorContext> {
    const resolved = await this.permissionsResolver.resolveForUser(userId);
    const memberships = resolved.memberId
      ? await this.loadFamilyMemberships(resolved.memberId)
      : [];

    return {
      userId,
      memberId: resolved.memberId,
      roles: resolved.roles,
      permissions: resolved.permissions,
      familyMemberships: memberships,
    };
  }

  private async loadFamilyMemberships(
    memberId: string,
  ): Promise<FamilyMembershipContext[]> {
    const rows = await this.prisma.familyMember.findMany({
      where: { memberId },
      include: { family: { select: { delegationEnabled: true } } },
    });
    return rows.map((row) => ({
      familyId: row.familyId,
      role: row.role,
      delegationEnabled: row.family.delegationEnabled,
    }));
  }

  isChurchAdminAccountOnly(ctx: ContributionActorContext): boolean {
    const hasAdminRole = ctx.roles.includes(ROLES.CHURCH_ADMIN);
    if (!hasAdminRole) return false;
    const hasMinistryAccess =
      this.hasAnyMinistryContributionPermission(ctx) ||
      ctx.familyMemberships.some((m) => LEADERSHIP_ROLES.includes(m.role));
    return !hasMinistryAccess;
  }

  private hasAnyMinistryContributionPermission(
    ctx: ContributionActorContext,
  ): boolean {
    return MINISTRY_CONTRIBUTION_PERMISSIONS.some((code) =>
      hasEffectivePermission(ctx.permissions, code),
    );
  }

  assertNotChurchAdminAccountOnly(ctx: ContributionActorContext): void {
    if (this.isChurchAdminAccountOnly(ctx)) {
      throw new ForbiddenException('Church admin account cannot access ministry contributions');
    }
  }

  /** Hidden feature — caller has no business seeing this route. */
  denyHiddenFeature(): never {
    throw new NotFoundException('Not found');
  }

  canSubmit(ctx: ContributionActorContext): boolean {
    if (this.isChurchAdminAccountOnly(ctx)) return false;
    return (
      Boolean(ctx.memberId) &&
      hasEffectivePermission(ctx.permissions, PERMISSIONS.CHOIR_CONTRIBUTION_SUBMIT)
    );
  }

  /**
   * v1.3 — every choir member profile retains personal visibility regardless of
   * leadership role; leadership expands scope, never replaces own.
   */
  canViewOwn(ctx: ContributionActorContext): boolean {
    if (this.isChurchAdminAccountOnly(ctx)) return false;
    return Boolean(ctx.memberId);
  }

  assertCanViewOwn(ctx: ContributionActorContext): void {
    if (!this.canViewOwn(ctx)) {
      if (this.isChurchAdminAccountOnly(ctx)) {
        throw new ForbiddenException(
          'Church admin account cannot access ministry contributions',
        );
      }
      throw new ForbiddenException('Member profile required');
    }
  }

  canViewAll(ctx: ContributionActorContext): boolean {
    if (this.isChurchAdminAccountOnly(ctx)) return false;
    return hasEffectivePermission(
      ctx.permissions,
      PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
    );
  }

  canViewAllProtocol(ctx: ContributionActorContext): boolean {
    if (this.isChurchAdminAccountOnly(ctx)) return false;
    return (
      hasEffectivePermission(ctx.permissions, PERMISSIONS.PROTOCOL_CONTRIBUTION_VIEW_ALL) ||
      hasEffectivePermission(ctx.permissions, PERMISSIONS.PROTOCOL_FINANCE_VIEW) ||
      hasEffectivePermission(ctx.permissions, PERMISSIONS.PROTOCOL_FINANCE_MANAGE) ||
      hasEffectivePermission(ctx.permissions, PERMISSIONS.PROTOCOL_FINANCE_APPROVE)
    );
  }

  canSubmitProtocol(ctx: ContributionActorContext): boolean {
    if (this.isChurchAdminAccountOnly(ctx)) return false;
    return (
      Boolean(ctx.memberId) &&
      hasEffectivePermission(ctx.permissions, PERMISSIONS.PROTOCOL_CONTRIBUTION_SUBMIT)
    );
  }

  canApproveProtocol(ctx: ContributionActorContext): boolean {
    if (this.isChurchAdminAccountOnly(ctx)) return false;
    return hasEffectivePermission(
      ctx.permissions,
      PERMISSIONS.PROTOCOL_FINANCE_APPROVE,
    );
  }

  assertCanSubmitProtocol(ctx: ContributionActorContext): void {
    if (!this.canSubmitProtocol(ctx)) {
      throw new ForbiddenException('Cannot submit protocol contributions');
    }
  }

  assertCanViewAllProtocol(ctx: ContributionActorContext): void {
    if (!this.canViewAllProtocol(ctx)) {
      this.denyHiddenFeature();
    }
  }

  assertCanApproveProtocol(ctx: ContributionActorContext): void {
    if (!this.canApproveProtocol(ctx)) {
      throw new ForbiddenException('Protocol treasurer approval required');
    }
  }

  getFamilyMembership(
    ctx: ContributionActorContext,
    familyId: string,
  ): FamilyMembershipContext | undefined {
    return ctx.familyMemberships.find((m) => m.familyId === familyId);
  }

  isFamilyLeadershipRole(role: FamilyMemberRole): boolean {
    return LEADERSHIP_ROLES.includes(role);
  }

  isFamilyRankingRole(role: FamilyMemberRole): boolean {
    return FAMILY_RANKING_ROLES.includes(role);
  }

  getFamilyRankingMemberships(ctx: ContributionActorContext) {
    return ctx.familyMemberships.filter((m) =>
      this.isFamilyRankingRole(m.role),
    );
  }

  canViewRankings(ctx: ContributionActorContext, familyId?: string): boolean {
    if (this.isChurchAdminAccountOnly(ctx)) return false;
    if (this.canViewAll(ctx)) return true;
    const rankingFamilies = this.getFamilyRankingMemberships(ctx);
    if (rankingFamilies.length === 0) return false;
    if (!familyId) return rankingFamilies.length > 0;
    return rankingFamilies.some((m) => m.familyId === familyId);
  }

  assertCanViewRankings(
    ctx: ContributionActorContext,
    familyId?: string,
  ): string | undefined {
    if (this.isChurchAdminAccountOnly(ctx)) {
      throw new ForbiddenException(
        'Church admin account cannot access ministry contributions',
      );
    }
    if (this.canViewAll(ctx)) return familyId;

    const rankingFamilies = this.getFamilyRankingMemberships(ctx);
    if (rankingFamilies.length === 0) {
      this.denyHiddenFeature();
    }

    if (familyId) {
      if (!rankingFamilies.some((m) => m.familyId === familyId)) {
        this.denyHiddenFeature();
      }
      return familyId;
    }

    if (rankingFamilies.length === 1) {
      return rankingFamilies[0].familyId;
    }

    throw new ForbiddenException('familyId is required');
  }

  resolveTotalsScope(
    ctx: ContributionActorContext,
    query: ContributionTotalsQuery,
  ): ContributionTotalsScope {
    this.assertNotChurchAdminAccountOnly(ctx);

    if (query.scope === 'own') {
      this.assertCanViewOwn(ctx);
      if (query.familyId) {
        this.denyHiddenFeature();
      }
      return { mode: 'own', memberId: ctx.memberId };
    }

    if (this.canViewAll(ctx)) {
      if (query.familyId) {
        return { mode: 'family', familyId: query.familyId };
      }
      return { mode: 'choir' };
    }

    const leadershipFamilies = ctx.familyMemberships.filter((m) =>
      this.isFamilyLeadershipRole(m.role),
    );

    if (leadershipFamilies.length > 0) {
      if (query.familyId) {
        if (!this.canViewFamily(ctx, query.familyId)) {
          const membership = this.getFamilyMembership(ctx, query.familyId);
          if (!membership || !this.isFamilyLeadershipRole(membership.role)) {
            this.denyHiddenFeature();
          }
          throw new ForbiddenException('Cannot view totals for this family');
        }
        return { mode: 'family', familyId: query.familyId };
      }

      if (leadershipFamilies.length === 1) {
        return { mode: 'family', familyId: leadershipFamilies[0].familyId };
      }

      throw new ForbiddenException('familyId is required');
    }

    this.assertCanViewOwn(ctx);
    if (query.familyId) {
      this.denyHiddenFeature();
    }
    return { mode: 'own', memberId: ctx.memberId };
  }

  canViewFamily(ctx: ContributionActorContext, familyId: string): boolean {
    if (this.canViewAll(ctx)) return true;
    const membership = this.getFamilyMembership(ctx, familyId);
    return Boolean(
      membership && this.isFamilyLeadershipRole(membership.role),
    );
  }

  canAccessFamilyInbox(ctx: ContributionActorContext, familyId: string): boolean {
    return this.canViewFamily(ctx, familyId);
  }

  canApproveFamily(ctx: ContributionActorContext, familyId: string): boolean {
    const membership = this.getFamilyMembership(ctx, familyId);
    if (!membership) return false;
    if (membership.role === FamilyMemberRole.HEAD) return true;
    if (membership.role === FamilyMemberRole.ASSISTANT_HEAD) {
      return membership.delegationEnabled;
    }
    return false;
  }

  canAdjustRecord(
    ctx: ContributionActorContext,
    record: { familyId: string | null; status: string },
  ): boolean {
    if (record.status !== 'CONFIRMED') return false;
    if (this.isChurchAdminAccountOnly(ctx)) return false;

    if (
      hasEffectivePermission(ctx.permissions, PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST) ||
      hasEffectivePermission(ctx.permissions, PERMISSIONS.PROTOCOL_CONTRIBUTION_ADJUST) ||
      hasEffectivePermission(ctx.permissions, PERMISSIONS.PROTOCOL_FINANCE_MANAGE)
    ) {
      return true;
    }

    const membership = record.familyId
      ? this.getFamilyMembership(ctx, record.familyId)
      : undefined;
    return membership?.role === FamilyMemberRole.HEAD;
  }

  assertCanSubmit(ctx: ContributionActorContext): void {
    if (!this.canSubmit(ctx)) {
      if (this.isChurchAdminAccountOnly(ctx)) {
        throw new ForbiddenException('Church admin account cannot access ministry contributions');
      }
      throw new ForbiddenException('Cannot submit contributions');
    }
  }

  assertCanViewAll(ctx: ContributionActorContext): void {
    if (!this.canViewAll(ctx)) {
      this.denyHiddenFeature();
    }
  }

  assertCanAccessFamilyInbox(
    ctx: ContributionActorContext,
    familyId: string,
  ): void {
    if (this.canAccessFamilyInbox(ctx, familyId)) return;

    const membership = this.getFamilyMembership(ctx, familyId);
    if (!this.canViewAll(ctx) && (!membership || !this.isFamilyLeadershipRole(membership.role))) {
      this.denyHiddenFeature();
    }

    throw new ForbiddenException('Cannot access family contribution inbox');
  }

  assertCanApproveFamily(
    ctx: ContributionActorContext,
    familyId: string,
  ): void {
    if (!this.canApproveFamily(ctx, familyId)) {
      throw new ForbiddenException('Cannot approve contributions for this family');
    }
  }

  assertCanRejectFamily(
    ctx: ContributionActorContext,
    familyId: string,
  ): void {
    this.assertCanApproveFamily(ctx, familyId);
  }

  /** Head may only adjust within own family; executives may adjust any. */
  assertCanAdjust(
    ctx: ContributionActorContext,
    record: { familyId: string | null; status: string },
  ): void {
    if (!this.canAdjustRecord(ctx, record)) {
      throw new ForbiddenException('Cannot adjust this contribution');
    }

    const hasGlobalAdjust =
      hasEffectivePermission(ctx.permissions, PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST) ||
      hasEffectivePermission(ctx.permissions, PERMISSIONS.PROTOCOL_CONTRIBUTION_ADJUST) ||
      hasEffectivePermission(ctx.permissions, PERMISSIONS.PROTOCOL_FINANCE_MANAGE);
    if (hasGlobalAdjust) return;

    const membership = record.familyId
      ? this.getFamilyMembership(ctx, record.familyId)
      : undefined;
    if (membership?.role === FamilyMemberRole.HEAD) return;

    throw new ForbiddenException('Cannot adjust contributions outside your family');
  }

  resolveFamilyApproverRole(
    ctx: ContributionActorContext,
    familyId: string,
  ): ContributionActorRoleSnapshot {
    const membership = this.getFamilyMembership(ctx, familyId);
    if (membership?.role === FamilyMemberRole.HEAD) return 'FAMILY_HEAD';
    if (membership?.role === FamilyMemberRole.ASSISTANT_HEAD) {
      return 'FAMILY_ASSISTANT_HEAD';
    }
    return this.resolveActorRoleSnapshot(ctx, familyId);
  }

  resolveActorRoleSnapshot(
    ctx: ContributionActorContext,
    recordFamilyId: string | null,
  ): ContributionActorRoleSnapshot {
    if (recordFamilyId) {
      const membership = this.getFamilyMembership(ctx, recordFamilyId);
      if (membership?.role === FamilyMemberRole.HEAD) return 'FAMILY_HEAD';
      if (membership?.role === FamilyMemberRole.ASSISTANT_HEAD) {
        return 'FAMILY_ASSISTANT_HEAD';
      }
    }

    const rolePriority: Array<[string, ContributionActorRoleSnapshot]> = [
      [ROLES.CHOIR_TREASURER, 'CHOIR_TREASURER'],
      [ROLES.CHOIR_PRESIDENT, 'CHOIR_PRESIDENT'],
      [ROLES.CHOIR_VICE_PRESIDENT, 'CHOIR_VICE_PRESIDENT'],
      [ROLES.CHOIR_FAMILY_COORDINATOR, 'CHOIR_FAMILY_COORDINATOR'],
    ];

    for (const [roleName, snapshot] of rolePriority) {
      if (ctx.roles.includes(roleName)) return snapshot;
    }

    if (
      hasEffectivePermission(ctx.permissions, PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST)
    ) {
      return 'CUSTOM_ADJUSTER';
    }

    return 'UNKNOWN';
  }

  async resolveFamilyIdForInbox(
    ctx: ContributionActorContext,
    familyId?: string,
  ): Promise<string> {
    if (familyId) {
      this.assertCanAccessFamilyInbox(ctx, familyId);
      return familyId;
    }

    if (this.canViewAll(ctx)) {
      throw new ForbiddenException('familyId is required');
    }

    const leadershipFamilies = ctx.familyMemberships.filter((m) =>
      LEADERSHIP_ROLES.includes(m.role),
    );
    if (leadershipFamilies.length === 1) {
      return leadershipFamilies[0].familyId;
    }
    if (leadershipFamilies.length > 1) {
      throw new ForbiddenException('familyId is required');
    }

    this.denyHiddenFeature();
  }
}
