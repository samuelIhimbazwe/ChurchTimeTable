import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MinistryMembershipStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PERMISSIONS } from '../common/constants/roles';
import {
  OPERATIONAL_UNIT_AUDIT_ACTIONS,
  OPERATIONAL_UNIT_AUDIT_ENTITY,
  leadershipPositionsForUnit,
} from './operational-unit.constants';
import {
  OperationalUnitAccessService,
  type OperationalUnitActorContext,
} from './operational-unit-access.service';
import {
  canManageUnitLeadership,
  canManageUnitMembers,
  canManageUnitPermissions,
  canManageUnitSettings,
  canViewUnitLeadership,
  canViewUnitMembers,
  hasGlobalOperationalUnitManage,
  hasGlobalOperationalUnitView,
  hasUnitPermission,
} from './operational-unit-access.util';
import type {
  AddOperationalUnitMemberDto,
  AssignOperationalUnitLeadershipDto,
  CreateOperationalUnitDto,
  EndOperationalUnitLeadershipDto,
  GrantOperationalUnitPermissionDto,
  UpdateOperationalUnitDto,
  UpdateOperationalUnitMemberDto,
  UpdateOperationalUnitSettingsDto,
} from './dto/operational-unit.dto';

const MEMBER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  memberNumber: true,
  status: true,
} as const;

@Injectable()
export class OperationalUnitsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private access: OperationalUnitAccessService,
  ) {}

  private async getUnitOrThrow(unitId: string) {
    const unit = await this.prisma.operationalUnit.findUnique({
      where: { id: unitId },
      include: {
        settings: true,
        ministry: { select: { id: true, code: true, name: true } },
      },
    });
    if (!unit) throw new NotFoundException('Operational unit not found');
    return unit;
  }

  private async assertUnitVisible(actorUserId: string, unitId: string) {
    const visible = await this.access.unitIdsVisibleTo(actorUserId);
    if (visible !== null && !visible.includes(unitId)) {
      throw new ForbiddenException('Operational unit access denied');
    }
  }

  private unitContext(actor: OperationalUnitActorContext, unitId: string, ministryId: string) {
    return {
      isUnitLeader: this.access.isUnitLeader(actor, unitId),
      ministryId,
    };
  }

  async list(actorUserId: string, ministryId?: string) {
    const actor = await this.access.resolveActor(actorUserId);
    const visibleIds = await this.access.unitIdsVisibleTo(actorUserId);

    const where: Prisma.OperationalUnitWhereInput = { isActive: true };
    if (ministryId) where.ministryId = ministryId;

    if (visibleIds !== null) {
      if (visibleIds.length === 0) return [];
      where.id = { in: visibleIds };
    } else if (!hasGlobalOperationalUnitView(actor.permissions)) {
      throw new ForbiddenException('Operational unit access denied');
    }

    const units = await this.prisma.operationalUnit.findMany({
      where,
      orderBy: [{ ministry: { name: 'asc' } }, { name: 'asc' }],
      include: {
        ministry: { select: { id: true, code: true, name: true } },
        _count: {
          select: {
            memberships: { where: { status: 'ACTIVE' } },
            leadershipAssignments: { where: { endedAt: null } },
          },
        },
      },
    });

    return units.map((u) => ({
      id: u.id,
      ministryId: u.ministryId,
      ministry: u.ministry,
      code: u.code,
      name: u.name,
      description: u.description,
      type: u.type,
      isActive: u.isActive,
      memberCount: u._count.memberships,
      leadershipCount: u._count.leadershipAssignments,
      createdAt: u.createdAt,
    }));
  }

  async getById(actorUserId: string, unitId: string) {
    await this.assertUnitVisible(actorUserId, unitId);
    const unit = await this.getUnitOrThrow(unitId);
    const [memberCount, leadershipCount, permissionCount] = await Promise.all([
      this.prisma.operationalUnitMembership.count({
        where: { operationalUnitId: unitId, status: 'ACTIVE' },
      }),
      this.prisma.operationalUnitLeadershipAssignment.count({
        where: { operationalUnitId: unitId, endedAt: null },
      }),
      this.prisma.operationalUnitPermissionAssignment.count({
        where: { operationalUnitId: unitId, revokedAt: null },
      }),
    ]);
    return { ...unit, memberCount, leadershipCount, permissionCount };
  }

  async create(actorUserId: string, dto: CreateOperationalUnitDto) {
    const actor = await this.access.resolveActor(actorUserId);
    if (!hasGlobalOperationalUnitManage(actor.permissions)) {
      throw new ForbiddenException('Operational unit creation denied');
    }

    const ministry = await this.prisma.ministry.findUnique({
      where: { id: dto.ministryId },
      include: { settings: true },
    });
    if (!ministry) throw new NotFoundException('Ministry not found');
    if (ministry.settings && !ministry.settings.allowOperationalUnits) {
      throw new BadRequestException(
        'Operational units are not enabled for this ministry',
      );
    }

    const code = dto.code.trim().toUpperCase();
    const unit = await this.prisma.operationalUnit.create({
      data: {
        ministryId: dto.ministryId,
        code,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        type: dto.type ?? 'CUSTOM',
        settings: { create: {} },
        leadershipPositions: {
          create: leadershipPositionsForUnit(dto.type ?? 'CUSTOM').map((p) => ({
            name: p.name,
            description: p.description,
            isSystem: p.isSystem,
          })),
        },
      },
      include: {
        settings: true,
        ministry: { select: { id: true, code: true, name: true } },
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: OPERATIONAL_UNIT_AUDIT_ACTIONS.CREATED,
      entity: OPERATIONAL_UNIT_AUDIT_ENTITY,
      entityId: unit.id,
      newValue: { code: unit.code, name: unit.name, ministryId: unit.ministryId },
    });

    return unit;
  }

  async update(actorUserId: string, unitId: string, dto: UpdateOperationalUnitDto) {
    const actor = await this.access.resolveActor(actorUserId);
    await this.assertUnitVisible(actorUserId, unitId);
    const existing = await this.getUnitOrThrow(unitId);

    const ctx = this.unitContext(actor, unitId, existing.ministryId);
    const canManage =
      hasGlobalOperationalUnitManage(actor.permissions) ||
      actor.ministryLeaderMinistryIds.has(existing.ministryId);
    if (!canManage) {
      throw new ForbiddenException('Operational unit update denied');
    }

    const unit = await this.prisma.operationalUnit.update({
      where: { id: unitId },
      data: {
        name: dto.name?.trim() ?? undefined,
        description:
          dto.description !== undefined ? dto.description?.trim() || null : undefined,
        type: dto.type,
        isActive: dto.isActive,
      },
      include: {
        settings: true,
        ministry: { select: { id: true, code: true, name: true } },
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: OPERATIONAL_UNIT_AUDIT_ACTIONS.UPDATED,
      entity: OPERATIONAL_UNIT_AUDIT_ENTITY,
      entityId: unitId,
      oldValue: { name: existing.name, isActive: existing.isActive },
      newValue: { name: unit.name, isActive: unit.isActive },
    });

    return unit;
  }

  async getSummary(actorUserId: string, unitId: string) {
    await this.assertUnitVisible(actorUserId, unitId);
    const unit = await this.getUnitOrThrow(unitId);
    const [memberCount, activeLeaders, activePermissions] = await Promise.all([
      this.prisma.operationalUnitMembership.count({
        where: { operationalUnitId: unitId, status: 'ACTIVE' },
      }),
      this.prisma.operationalUnitLeadershipAssignment.count({
        where: { operationalUnitId: unitId, endedAt: null },
      }),
      this.prisma.operationalUnitPermissionAssignment.count({
        where: { operationalUnitId: unitId, revokedAt: null },
      }),
    ]);
    return {
      operationalUnitId: unit.id,
      ministryId: unit.ministryId,
      ministry: unit.ministry,
      code: unit.code,
      name: unit.name,
      type: unit.type,
      isActive: unit.isActive,
      memberCount,
      activeLeaders,
      activePermissions,
      createdAt: unit.createdAt,
    };
  }

  async listMembers(actorUserId: string, unitId: string, search?: string) {
    const actor = await this.access.resolveActor(actorUserId);
    const unit = await this.getUnitOrThrow(unitId);
    await this.assertUnitVisible(actorUserId, unitId);
    const ctx = this.unitContext(actor, unitId, unit.ministryId);
    if (
      !canViewUnitMembers(
        actor.permissions,
        actor.unitScoped,
        unitId,
        actor.ministryLeaderMinistryIds,
        unit.ministryId,
        ctx.isUnitLeader,
      )
    ) {
      throw new ForbiddenException('Operational unit member view denied');
    }

    const where: Prisma.OperationalUnitMembershipWhereInput = {
      operationalUnitId: unitId,
      status: { not: 'REMOVED' },
    };
    if (search?.trim()) {
      const q = search.trim();
      where.member = {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { memberNumber: { contains: q } },
        ],
      };
    }

    const rows = await this.prisma.operationalUnitMembership.findMany({
      where,
      orderBy: [{ status: 'asc' }, { joinedAt: 'desc' }],
      include: { member: { select: MEMBER_SELECT } },
    });

    return rows.map((row) => ({
      id: row.id,
      operationalUnitId: row.operationalUnitId,
      memberId: row.memberId,
      member: row.member,
      joinedAt: row.joinedAt,
      status: row.status,
      notes: row.notes,
    }));
  }

  async addMember(
    actorUserId: string,
    unitId: string,
    dto: AddOperationalUnitMemberDto,
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    const unit = await this.getUnitOrThrow(unitId);
    await this.assertUnitVisible(actorUserId, unitId);
    const ctx = this.unitContext(actor, unitId, unit.ministryId);
    if (
      !canManageUnitMembers(
        actor.permissions,
        actor.unitScoped,
        unitId,
        actor.ministryLeaderMinistryIds,
        unit.ministryId,
        ctx.isUnitLeader,
      )
    ) {
      throw new ForbiddenException('Operational unit member management denied');
    }

    await this.prisma.member.findUniqueOrThrow({ where: { id: dto.memberId } });

    const existing = await this.prisma.operationalUnitMembership.findUnique({
      where: {
        operationalUnitId_memberId: {
          operationalUnitId: unitId,
          memberId: dto.memberId,
        },
      },
    });

    let membership;
    if (existing) {
      if (existing.status === 'ACTIVE') {
        throw new BadRequestException('Member already active in this unit');
      }
      membership = await this.prisma.operationalUnitMembership.update({
        where: { id: existing.id },
        data: {
          status: 'ACTIVE',
          notes: dto.notes ?? existing.notes,
          joinedAt: new Date(),
        },
        include: { member: { select: MEMBER_SELECT } },
      });
    } else {
      membership = await this.prisma.operationalUnitMembership.create({
        data: {
          operationalUnitId: unitId,
          memberId: dto.memberId,
          notes: dto.notes,
        },
        include: { member: { select: MEMBER_SELECT } },
      });
    }

    await this.audit.log({
      userId: actorUserId,
      action: OPERATIONAL_UNIT_AUDIT_ACTIONS.MEMBER_ADDED,
      entity: OPERATIONAL_UNIT_AUDIT_ENTITY,
      entityId: unitId,
      newValue: { memberId: dto.memberId, membershipId: membership.id },
    });

    return membership;
  }

  async updateMember(
    actorUserId: string,
    unitId: string,
    memberId: string,
    dto: UpdateOperationalUnitMemberDto,
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    const unit = await this.getUnitOrThrow(unitId);
    await this.assertUnitVisible(actorUserId, unitId);
    const ctx = this.unitContext(actor, unitId, unit.ministryId);
    if (
      !canManageUnitMembers(
        actor.permissions,
        actor.unitScoped,
        unitId,
        actor.ministryLeaderMinistryIds,
        unit.ministryId,
        ctx.isUnitLeader,
      )
    ) {
      throw new ForbiddenException('Operational unit member management denied');
    }

    const membership = await this.prisma.operationalUnitMembership.findUnique({
      where: {
        operationalUnitId_memberId: { operationalUnitId: unitId, memberId },
      },
    });
    if (!membership) throw new NotFoundException('Membership not found');

    const updated = await this.prisma.operationalUnitMembership.update({
      where: { id: membership.id },
      data: {
        status: dto.status as MinistryMembershipStatus | undefined,
        notes: dto.notes,
      },
      include: { member: { select: MEMBER_SELECT } },
    });

    if (dto.status === 'REMOVED') {
      await this.audit.log({
        userId: actorUserId,
        action: OPERATIONAL_UNIT_AUDIT_ACTIONS.MEMBER_REMOVED,
        entity: OPERATIONAL_UNIT_AUDIT_ENTITY,
        entityId: unitId,
        oldValue: { memberId, status: membership.status },
        newValue: { status: 'REMOVED' },
      });
    }

    return updated;
  }

  async removeMember(actorUserId: string, unitId: string, memberId: string) {
    return this.updateMember(actorUserId, unitId, memberId, { status: 'REMOVED' });
  }

  async listLeadership(actorUserId: string, unitId: string) {
    const actor = await this.access.resolveActor(actorUserId);
    const unit = await this.getUnitOrThrow(unitId);
    await this.assertUnitVisible(actorUserId, unitId);
    const ctx = this.unitContext(actor, unitId, unit.ministryId);
    if (
      !canViewUnitLeadership(
        actor.permissions,
        actor.unitScoped,
        unitId,
        actor.ministryLeaderMinistryIds,
        unit.ministryId,
        ctx.isUnitLeader,
      )
    ) {
      throw new ForbiddenException('Operational unit leadership view denied');
    }

    const [current, history, positions] = await Promise.all([
      this.prisma.operationalUnitLeadershipAssignment.findMany({
        where: { operationalUnitId: unitId, endedAt: null },
        include: { member: { select: MEMBER_SELECT }, position: true },
        orderBy: { startedAt: 'asc' },
      }),
      this.prisma.operationalUnitLeadershipAssignment.findMany({
        where: { operationalUnitId: unitId, endedAt: { not: null } },
        include: { member: { select: MEMBER_SELECT }, position: true },
        orderBy: { endedAt: 'desc' },
        take: 100,
      }),
      this.prisma.operationalUnitLeadershipPosition.findMany({
        where: { operationalUnitId: unitId, isActive: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return { current, history, positions };
  }

  async assignLeadership(
    actorUserId: string,
    unitId: string,
    dto: AssignOperationalUnitLeadershipDto,
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    const unit = await this.getUnitOrThrow(unitId);
    await this.assertUnitVisible(actorUserId, unitId);
    const ctx = this.unitContext(actor, unitId, unit.ministryId);
    if (
      !canManageUnitLeadership(
        actor.permissions,
        actor.unitScoped,
        unitId,
        actor.ministryLeaderMinistryIds,
        unit.ministryId,
        ctx.isUnitLeader,
      )
    ) {
      throw new ForbiddenException('Operational unit leadership management denied');
    }

    const position = await this.prisma.operationalUnitLeadershipPosition.findFirst({
      where: { id: dto.positionId, operationalUnitId: unitId, isActive: true },
    });
    if (!position) throw new NotFoundException('Leadership position not found');

    await this.prisma.member.findUniqueOrThrow({ where: { id: dto.memberId } });

    const assignment = await this.prisma.operationalUnitLeadershipAssignment.create({
      data: {
        operationalUnitId: unitId,
        memberId: dto.memberId,
        positionId: dto.positionId,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : new Date(),
        assignedByUserId: actorUserId,
      },
      include: { member: { select: MEMBER_SELECT }, position: true },
    });

    await this.audit.log({
      userId: actorUserId,
      action: OPERATIONAL_UNIT_AUDIT_ACTIONS.LEADERSHIP_ASSIGNED,
      entity: OPERATIONAL_UNIT_AUDIT_ENTITY,
      entityId: unitId,
      newValue: {
        assignmentId: assignment.id,
        memberId: dto.memberId,
        positionId: dto.positionId,
      },
    });

    return assignment;
  }

  async endLeadership(
    actorUserId: string,
    unitId: string,
    assignmentId: string,
    dto: EndOperationalUnitLeadershipDto,
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    const unit = await this.getUnitOrThrow(unitId);
    await this.assertUnitVisible(actorUserId, unitId);
    const ctx = this.unitContext(actor, unitId, unit.ministryId);
    if (
      !canManageUnitLeadership(
        actor.permissions,
        actor.unitScoped,
        unitId,
        actor.ministryLeaderMinistryIds,
        unit.ministryId,
        ctx.isUnitLeader,
      )
    ) {
      throw new ForbiddenException('Operational unit leadership management denied');
    }

    const assignment =
      await this.prisma.operationalUnitLeadershipAssignment.findFirst({
        where: { id: assignmentId, operationalUnitId: unitId },
      });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.endedAt) {
      throw new BadRequestException('Assignment already ended');
    }

    const ended = await this.prisma.operationalUnitLeadershipAssignment.update({
      where: { id: assignmentId },
      data: { endedAt: dto.endedAt ? new Date(dto.endedAt) : new Date() },
      include: { member: { select: MEMBER_SELECT }, position: true },
    });

    await this.audit.log({
      userId: actorUserId,
      action: OPERATIONAL_UNIT_AUDIT_ACTIONS.LEADERSHIP_ENDED,
      entity: OPERATIONAL_UNIT_AUDIT_ENTITY,
      entityId: unitId,
      oldValue: { assignmentId, endedAt: null },
      newValue: { assignmentId, endedAt: ended.endedAt },
    });

    return ended;
  }

  async listPermissions(actorUserId: string, unitId: string) {
    const actor = await this.access.resolveActor(actorUserId);
    const unit = await this.getUnitOrThrow(unitId);
    await this.assertUnitVisible(actorUserId, unitId);
    if (
      !canManageUnitPermissions(
        actor.permissions,
        actor.unitScoped,
        unitId,
        actor.ministryLeaderMinistryIds,
        unit.ministryId,
      ) &&
      !hasUnitPermission(
        actor.permissions,
        actor.unitScoped,
        unitId,
        PERMISSIONS.OPERATIONAL_UNIT_REPORTS_VIEW,
      )
    ) {
      throw new ForbiddenException('Operational unit permissions view denied');
    }

    return this.prisma.operationalUnitPermissionAssignment.findMany({
      where: { operationalUnitId: unitId, revokedAt: null },
      include: {
        member: { select: MEMBER_SELECT },
        grantedBy: { select: { id: true, email: true } },
      },
      orderBy: { grantedAt: 'desc' },
    });
  }

  async grantPermission(
    actorUserId: string,
    unitId: string,
    dto: GrantOperationalUnitPermissionDto,
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    const unit = await this.getUnitOrThrow(unitId);
    await this.assertUnitVisible(actorUserId, unitId);
    if (
      !canManageUnitPermissions(
        actor.permissions,
        actor.unitScoped,
        unitId,
        actor.ministryLeaderMinistryIds,
        unit.ministryId,
      )
    ) {
      throw new ForbiddenException('Operational unit permission grant denied');
    }

    await this.prisma.member.findUniqueOrThrow({ where: { id: dto.memberId } });

    const active = await this.prisma.operationalUnitPermissionAssignment.findFirst({
      where: {
        operationalUnitId: unitId,
        memberId: dto.memberId,
        permission: dto.permission,
        revokedAt: null,
      },
    });
    if (active) {
      throw new BadRequestException('Permission already granted');
    }

    const assignment = await this.prisma.operationalUnitPermissionAssignment.create({
      data: {
        operationalUnitId: unitId,
        memberId: dto.memberId,
        permission: dto.permission,
        grantedByUserId: actorUserId,
      },
      include: { member: { select: MEMBER_SELECT } },
    });

    await this.audit.log({
      userId: actorUserId,
      action: OPERATIONAL_UNIT_AUDIT_ACTIONS.PERMISSION_GRANTED,
      entity: OPERATIONAL_UNIT_AUDIT_ENTITY,
      entityId: unitId,
      newValue: {
        assignmentId: assignment.id,
        memberId: dto.memberId,
        permission: dto.permission,
      },
    });

    return assignment;
  }

  async revokePermission(
    actorUserId: string,
    unitId: string,
    assignmentId: string,
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    const unit = await this.getUnitOrThrow(unitId);
    await this.assertUnitVisible(actorUserId, unitId);
    if (
      !canManageUnitPermissions(
        actor.permissions,
        actor.unitScoped,
        unitId,
        actor.ministryLeaderMinistryIds,
        unit.ministryId,
      )
    ) {
      throw new ForbiddenException('Operational unit permission revoke denied');
    }

    const assignment =
      await this.prisma.operationalUnitPermissionAssignment.findFirst({
        where: { id: assignmentId, operationalUnitId: unitId, revokedAt: null },
      });
    if (!assignment) throw new NotFoundException('Permission assignment not found');

    const revoked = await this.prisma.operationalUnitPermissionAssignment.update({
      where: { id: assignmentId },
      data: { revokedAt: new Date() },
      include: { member: { select: MEMBER_SELECT } },
    });

    await this.audit.log({
      userId: actorUserId,
      action: OPERATIONAL_UNIT_AUDIT_ACTIONS.PERMISSION_REVOKED,
      entity: OPERATIONAL_UNIT_AUDIT_ENTITY,
      entityId: unitId,
      oldValue: {
        assignmentId,
        permission: assignment.permission,
        memberId: assignment.memberId,
      },
    });

    return revoked;
  }

  async getSettings(actorUserId: string, unitId: string) {
    const actor = await this.access.resolveActor(actorUserId);
    const unit = await this.getUnitOrThrow(unitId);
    await this.assertUnitVisible(actorUserId, unitId);
    const ctx = this.unitContext(actor, unitId, unit.ministryId);
    if (
      !canManageUnitSettings(
        actor.permissions,
        actor.unitScoped,
        unitId,
        actor.ministryLeaderMinistryIds,
        unit.ministryId,
        ctx.isUnitLeader,
      ) &&
      !hasGlobalOperationalUnitView(actor.permissions)
    ) {
      throw new ForbiddenException('Operational unit settings view denied');
    }

    if (unit.settings) return unit.settings;
    return this.prisma.operationalUnitSettings.create({
      data: { operationalUnitId: unitId },
    });
  }

  async updateSettings(
    actorUserId: string,
    unitId: string,
    dto: UpdateOperationalUnitSettingsDto,
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    const unit = await this.getUnitOrThrow(unitId);
    await this.assertUnitVisible(actorUserId, unitId);
    const ctx = this.unitContext(actor, unitId, unit.ministryId);
    if (
      !canManageUnitSettings(
        actor.permissions,
        actor.unitScoped,
        unitId,
        actor.ministryLeaderMinistryIds,
        unit.ministryId,
        ctx.isUnitLeader,
      )
    ) {
      throw new ForbiddenException('Operational unit settings management denied');
    }

    const existing = await this.getSettings(actorUserId, unitId);
    const settings = await this.prisma.operationalUnitSettings.upsert({
      where: { operationalUnitId: unitId },
      create: { operationalUnitId: unitId, ...dto },
      update: { ...dto },
    });

    await this.audit.log({
      userId: actorUserId,
      action: OPERATIONAL_UNIT_AUDIT_ACTIONS.SETTINGS_UPDATED,
      entity: OPERATIONAL_UNIT_AUDIT_ENTITY,
      entityId: unitId,
      oldValue: existing,
      newValue: settings,
    });

    return settings;
  }

  async listActivity(actorUserId: string, unitId: string) {
    await this.assertUnitVisible(actorUserId, unitId);
    const actor = await this.access.resolveActor(actorUserId);
    if (!hasGlobalOperationalUnitView(actor.permissions)) {
      throw new ForbiddenException('Operational unit activity view denied');
    }

    return this.prisma.auditLog.findMany({
      where: { entity: OPERATIONAL_UNIT_AUDIT_ENTITY, entityId: unitId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { id: true, email: true } } },
    });
  }
}
