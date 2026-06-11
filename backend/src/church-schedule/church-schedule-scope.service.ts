import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ChurchScheduleScopeType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS, ROLES } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import { hasGlobalMinistryManage } from '../ministries/ministry-access.util';
import { OperationalUnitAccessService } from '../operational-units/operational-unit-access.service';
import { hasGlobalOperationalUnitManage } from '../operational-units/operational-unit-access.util';
import { PROTOCOL_SCHEDULE_SCOPE_ID } from './church-schedule.constants';
import {
  CHOIR_SCHEDULE_OFFICER_ROLES,
  formatScopeLabel,
  PROTOCOL_SCHEDULE_OFFICER_ROLES,
  type ScheduleScopeRef,
} from './church-schedule.util';

@Injectable()
export class ChurchScheduleScopeService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
    private ministryAccess: MinistryAccessService,
    private unitAccess: OperationalUnitAccessService,
  ) {}

  private async resolved(actorUserId: string) {
    return this.permissions.resolveForUser(actorUserId);
  }

  isChurchScheduleAdmin(permissions: string[]) {
    return (
      hasEffectivePermission(permissions, PERMISSIONS.CHURCH_SCHEDULE_MANAGE) ||
      hasEffectivePermission(permissions, PERMISSIONS.CHURCH_SCHEDULE_RESOLVE)
    );
  }

  canSubmit(permissions: string[]) {
    return hasEffectivePermission(permissions, PERMISSIONS.CHURCH_SCHEDULE_SUBMIT);
  }

  async assertSubmitScope(
    actorUserId: string,
    scopeType: ChurchScheduleScopeType,
    scopeId: string,
  ) {
    const resolved = await this.resolved(actorUserId);
    if (this.isChurchScheduleAdmin(resolved.permissions)) return;

    if (!this.canSubmit(resolved.permissions)) {
      throw new ForbiddenException('Schedule submit permission denied');
    }

    const allowed = await this.listSubmitScopes(actorUserId);
    const ok = allowed.some(
      (s) => s.scopeType === scopeType && s.scopeId === scopeId,
    );
    if (!ok) {
      throw new ForbiddenException('Cannot submit for this scope');
    }
  }

  async listSubmitScopes(actorUserId: string): Promise<ScheduleScopeRef[]> {
    const resolved = await this.resolved(actorUserId);
    if (this.isChurchScheduleAdmin(resolved.permissions)) {
      return this.listAllScopes();
    }
    if (!this.canSubmit(resolved.permissions)) {
      return [];
    }

    const scopes: ScheduleScopeRef[] = [];

    const choirScopes = await this.choirScopesFor(actorUserId, resolved.roles);
    scopes.push(...choirScopes);

    const ministryScopes = await this.ministryScopesFor(actorUserId);
    scopes.push(...ministryScopes);

    if (this.isProtocolOfficer(resolved.roles)) {
      scopes.push({
        scopeType: ChurchScheduleScopeType.PROTOCOL,
        scopeId: PROTOCOL_SCHEDULE_SCOPE_ID,
        label: formatScopeLabel(ChurchScheduleScopeType.PROTOCOL, 'Protocol'),
      });
    }

    const unitScopes = await this.unitScopesFor(actorUserId);
    scopes.push(...unitScopes);

    return scopes;
  }

  private isProtocolOfficer(roles: string[]) {
    return roles.some((r) =>
      PROTOCOL_SCHEDULE_OFFICER_ROLES.includes(
        r as (typeof PROTOCOL_SCHEDULE_OFFICER_ROLES)[number],
      ),
    );
  }

  private async choirScopesFor(
    actorUserId: string,
    roles: string[],
  ): Promise<ScheduleScopeRef[]> {
    const isOfficer = roles.some((r) =>
      CHOIR_SCHEDULE_OFFICER_ROLES.includes(
        r as (typeof CHOIR_SCHEDULE_OFFICER_ROLES)[number],
      ),
    );
    if (!isOfficer) return [];

    const memberships = await this.prisma.choirMembership.findMany({
      where: { userId: actorUserId, isActive: true },
      include: { choir: { select: { id: true, name: true, isActive: true } } },
    });

    return memberships
      .filter((m) => m.choir.isActive)
      .map((m) => ({
        scopeType: ChurchScheduleScopeType.CHOIR,
        scopeId: m.choirId,
        label: formatScopeLabel(ChurchScheduleScopeType.CHOIR, m.choir.name),
      }));
  }

  private async ministryScopesFor(actorUserId: string): Promise<ScheduleScopeRef[]> {
    const actor = await this.ministryAccess.resolveActor(actorUserId);
    if (hasGlobalMinistryManage(actor.permissions)) {
      const ministries = await this.prisma.ministry.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      return ministries.map((m) => ({
        scopeType: ChurchScheduleScopeType.MINISTRY,
        scopeId: m.id,
        label: formatScopeLabel(ChurchScheduleScopeType.MINISTRY, m.name),
      }));
    }

    const visible = await this.ministryAccess.ministryIdsVisibleTo(actorUserId);
    if (!visible?.length) return [];

    const ministries = await this.prisma.ministry.findMany({
      where: { id: { in: visible }, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const leadershipIds = actor.memberId
      ? (
          await this.prisma.ministryLeadershipAssignment.findMany({
            where: { memberId: actor.memberId, endedAt: null },
            select: { ministryId: true },
          })
        ).map((r) => r.ministryId)
      : [];

    return ministries
      .filter((m) => leadershipIds.includes(m.id))
      .map((m) => ({
        scopeType: ChurchScheduleScopeType.MINISTRY,
        scopeId: m.id,
        label: formatScopeLabel(ChurchScheduleScopeType.MINISTRY, m.name),
      }));
  }

  private async unitScopesFor(actorUserId: string): Promise<ScheduleScopeRef[]> {
    const actor = await this.unitAccess.resolveActor(actorUserId);
    if (hasGlobalOperationalUnitManage(actor.permissions)) {
      const units = await this.prisma.operationalUnit.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      return units.map((u) => ({
        scopeType: ChurchScheduleScopeType.OPERATIONAL_UNIT,
        scopeId: u.id,
        label: formatScopeLabel(ChurchScheduleScopeType.OPERATIONAL_UNIT, u.name),
      }));
    }

    const visible = await this.unitAccess.unitIdsVisibleTo(actorUserId);
    if (!visible?.length) return [];

    const leaderUnitIds = visible.filter((unitId) =>
      this.unitAccess.isUnitLeader(actor, unitId),
    );
    if (!leaderUnitIds.length) return [];

    const units = await this.prisma.operationalUnit.findMany({
      where: { id: { in: leaderUnitIds }, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return units.map((u) => ({
      scopeType: ChurchScheduleScopeType.OPERATIONAL_UNIT,
      scopeId: u.id,
      label: formatScopeLabel(ChurchScheduleScopeType.OPERATIONAL_UNIT, u.name),
    }));
  }

  private async listAllScopes(): Promise<ScheduleScopeRef[]> {
    const [choirs, ministries, units] = await Promise.all([
      this.prisma.choir.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.ministry.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.operationalUnit.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return [
      ...choirs.map((c) => ({
        scopeType: ChurchScheduleScopeType.CHOIR,
        scopeId: c.id,
        label: formatScopeLabel(ChurchScheduleScopeType.CHOIR, c.name),
      })),
      ...ministries.map((m) => ({
        scopeType: ChurchScheduleScopeType.MINISTRY,
        scopeId: m.id,
        label: formatScopeLabel(ChurchScheduleScopeType.MINISTRY, m.name),
      })),
      {
        scopeType: ChurchScheduleScopeType.PROTOCOL,
        scopeId: PROTOCOL_SCHEDULE_SCOPE_ID,
        label: formatScopeLabel(ChurchScheduleScopeType.PROTOCOL, 'Protocol'),
      },
      ...units.map((u) => ({
        scopeType: ChurchScheduleScopeType.OPERATIONAL_UNIT,
        scopeId: u.id,
        label: formatScopeLabel(ChurchScheduleScopeType.OPERATIONAL_UNIT, u.name),
      })),
    ];
  }

  async validateScopeEntity(
    scopeType: ChurchScheduleScopeType,
    scopeId: string,
  ) {
    switch (scopeType) {
      case ChurchScheduleScopeType.CHOIR: {
        const choir = await this.prisma.choir.findFirst({
          where: { id: scopeId, isActive: true },
        });
        if (!choir) throw new NotFoundException('Choir not found');
        return;
      }
      case ChurchScheduleScopeType.MINISTRY: {
        const ministry = await this.prisma.ministry.findFirst({
          where: { id: scopeId, isActive: true },
        });
        if (!ministry) throw new NotFoundException('Ministry not found');
        return;
      }
      case ChurchScheduleScopeType.PROTOCOL:
        if (scopeId !== PROTOCOL_SCHEDULE_SCOPE_ID) {
          throw new NotFoundException('Protocol scope not found');
        }
        return;
      case ChurchScheduleScopeType.OPERATIONAL_UNIT: {
        const unit = await this.prisma.operationalUnit.findFirst({
          where: { id: scopeId, isActive: true },
        });
        if (!unit) throw new NotFoundException('Operational unit not found');
        return;
      }
      default:
        throw new NotFoundException('Unknown scope');
    }
  }
}
