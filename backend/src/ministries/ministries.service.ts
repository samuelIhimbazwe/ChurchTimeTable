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
  MINISTRY_AUDIT_ACTIONS,
  MINISTRY_AUDIT_ENTITY,
  leadershipPositionsForMinistry,
} from './ministry.constants';
import { MinistryAccessService } from './ministry-access.service';
import {
  canManageMinistryLeadership,
  canManageMinistryMembers,
  canManageMinistryPermissions,
  canManageMinistrySettings,
  canViewMinistryLeadership,
  canViewMinistryMembers,
  canViewMinistrySettings,
  hasGlobalMinistryManage,
  hasGlobalMinistryView,
  hasMinistryPermission,
} from './ministry-access.util';
import type {
  AddMinistryMemberDto,
  AssignMinistryLeadershipDto,
  CreateMinistryDto,
  EndMinistryLeadershipDto,
  GrantMinistryPermissionDto,
  UpdateMinistryDto,
  UpdateMinistryMemberDto,
  UpdateMinistrySettingsDto,
} from './dto/ministry.dto';

const MEMBER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  memberNumber: true,
  status: true,
} as const;

@Injectable()
export class MinistriesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private access: MinistryAccessService,
  ) {}

  private async getMinistryOrThrow(ministryId: string) {
    const ministry = await this.prisma.ministry.findUnique({
      where: { id: ministryId },
      include: { settings: true },
    });
    if (!ministry) throw new NotFoundException('Ministry not found');
    return ministry;
  }

  private async assertMinistryVisible(actorUserId: string, ministryId: string) {
    const visible = await this.access.ministryIdsVisibleTo(actorUserId);
    if (visible !== null && !visible.includes(ministryId)) {
      throw new ForbiddenException('Ministry access denied');
    }
  }

  async list(actorUserId: string) {
    const actor = await this.access.resolveActor(actorUserId);
    const visibleIds = await this.access.ministryIdsVisibleTo(actorUserId);

    const where: Prisma.MinistryWhereInput = { isActive: true };
    if (visibleIds !== null) {
      if (visibleIds.length === 0) return [];
      where.id = { in: visibleIds };
    } else if (!hasGlobalMinistryView(actor.permissions)) {
      throw new ForbiddenException('Ministry access denied');
    }

    const ministries = await this.prisma.ministry.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            memberships: { where: { status: 'ACTIVE' } },
            leadershipAssignments: { where: { endedAt: null } },
          },
        },
      },
    });

    return ministries.map((m) => ({
      id: m.id,
      code: m.code,
      name: m.name,
      description: m.description,
      isActive: m.isActive,
      memberCount: m._count.memberships,
      leadershipCount: m._count.leadershipAssignments,
      createdAt: m.createdAt,
    }));
  }

  async getById(actorUserId: string, ministryId: string) {
    await this.assertMinistryVisible(actorUserId, ministryId);
    const ministry = await this.getMinistryOrThrow(ministryId);
    const [memberCount, leadershipCount, permissionCount] = await Promise.all([
      this.prisma.ministryMembership.count({
        where: { ministryId, status: 'ACTIVE' },
      }),
      this.prisma.ministryLeadershipAssignment.count({
        where: { ministryId, endedAt: null },
      }),
      this.prisma.ministryPermissionAssignment.count({
        where: { ministryId, revokedAt: null },
      }),
    ]);
    return {
      ...ministry,
      memberCount,
      leadershipCount,
      permissionCount,
    };
  }

  async create(actorUserId: string, dto: CreateMinistryDto) {
    const actor = await this.access.resolveActor(actorUserId);
    if (
      !hasGlobalMinistryManage(actor.permissions) &&
      !actor.permissions.includes(PERMISSIONS.MINISTRY_CREATE)
    ) {
      throw new ForbiddenException('Ministry creation denied');
    }

    const code = dto.code.trim().toUpperCase();
    const ministry = await this.prisma.ministry.create({
      data: {
        code,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        settings: { create: {} },
        leadershipPositions: {
          create: leadershipPositionsForMinistry(code).map((p) => ({
            name: p.name,
            description: p.description,
            isSystem: p.isSystem,
          })),
        },
      },
      include: { settings: true },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_AUDIT_ACTIONS.CREATED,
      entity: MINISTRY_AUDIT_ENTITY,
      entityId: ministry.id,
      newValue: { code: ministry.code, name: ministry.name },
    });

    return ministry;
  }

  async update(actorUserId: string, ministryId: string, dto: UpdateMinistryDto) {
    const actor = await this.access.resolveActor(actorUserId);
    if (!hasGlobalMinistryManage(actor.permissions)) {
      throw new ForbiddenException('Ministry update denied');
    }

    const existing = await this.getMinistryOrThrow(ministryId);
    const ministry = await this.prisma.ministry.update({
      where: { id: ministryId },
      data: {
        name: dto.name?.trim() ?? undefined,
        description: dto.description !== undefined ? dto.description?.trim() || null : undefined,
        isActive: dto.isActive,
      },
      include: { settings: true },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_AUDIT_ACTIONS.UPDATED,
      entity: MINISTRY_AUDIT_ENTITY,
      entityId: ministryId,
      oldValue: { name: existing.name, isActive: existing.isActive },
      newValue: { name: ministry.name, isActive: ministry.isActive },
    });

    return ministry;
  }

  async getSummary(actorUserId: string, ministryId: string) {
    await this.assertMinistryVisible(actorUserId, ministryId);
    const ministry = await this.getMinistryOrThrow(ministryId);
    const [memberCount, activeLeaders, activePermissions] = await Promise.all([
      this.prisma.ministryMembership.count({
        where: { ministryId, status: 'ACTIVE' },
      }),
      this.prisma.ministryLeadershipAssignment.count({
        where: { ministryId, endedAt: null },
      }),
      this.prisma.ministryPermissionAssignment.count({
        where: { ministryId, revokedAt: null },
      }),
    ]);
    return {
      ministryId: ministry.id,
      code: ministry.code,
      name: ministry.name,
      memberCount,
      activeLeaders,
      activePermissions,
      createdAt: ministry.createdAt,
    };
  }

  async listMembers(actorUserId: string, ministryId: string, search?: string) {
    const actor = await this.access.resolveActor(actorUserId);
    await this.assertMinistryVisible(actorUserId, ministryId);
    if (!canViewMinistryMembers(actor.permissions, actor.ministryScoped, ministryId)) {
      throw new ForbiddenException('Ministry member view denied');
    }

    const where: Prisma.MinistryMembershipWhereInput = {
      ministryId,
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

    const rows = await this.prisma.ministryMembership.findMany({
      where,
      orderBy: [{ status: 'asc' }, { joinedAt: 'desc' }],
      include: { member: { select: MEMBER_SELECT } },
    });

    return rows.map((row) => ({
      id: row.id,
      ministryId: row.ministryId,
      memberId: row.memberId,
      member: row.member,
      joinedAt: row.joinedAt,
      status: row.status,
      notes: row.notes,
    }));
  }

  async addMember(actorUserId: string, ministryId: string, dto: AddMinistryMemberDto) {
    const actor = await this.access.resolveActor(actorUserId);
    await this.assertMinistryVisible(actorUserId, ministryId);
    if (!canManageMinistryMembers(actor.permissions, actor.ministryScoped, ministryId)) {
      throw new ForbiddenException('Ministry member management denied');
    }

    await this.prisma.member.findUniqueOrThrow({ where: { id: dto.memberId } });

    const existing = await this.prisma.ministryMembership.findUnique({
      where: { ministryId_memberId: { ministryId, memberId: dto.memberId } },
    });

    let membership;
    if (existing) {
      if (existing.status === 'ACTIVE') {
        throw new BadRequestException('Member already active in this ministry');
      }
      membership = await this.prisma.ministryMembership.update({
        where: { id: existing.id },
        data: {
          status: 'ACTIVE',
          notes: dto.notes ?? existing.notes,
          joinedAt: new Date(),
        },
        include: { member: { select: MEMBER_SELECT } },
      });
    } else {
      membership = await this.prisma.ministryMembership.create({
        data: {
          ministryId,
          memberId: dto.memberId,
          notes: dto.notes,
        },
        include: { member: { select: MEMBER_SELECT } },
      });
    }

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_AUDIT_ACTIONS.MEMBER_ADDED,
      entity: MINISTRY_AUDIT_ENTITY,
      entityId: ministryId,
      newValue: { memberId: dto.memberId, membershipId: membership.id },
    });

    return membership;
  }

  async updateMember(
    actorUserId: string,
    ministryId: string,
    memberId: string,
    dto: UpdateMinistryMemberDto,
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    await this.assertMinistryVisible(actorUserId, ministryId);
    if (!canManageMinistryMembers(actor.permissions, actor.ministryScoped, ministryId)) {
      throw new ForbiddenException('Ministry member management denied');
    }

    const membership = await this.prisma.ministryMembership.findUnique({
      where: { ministryId_memberId: { ministryId, memberId } },
    });
    if (!membership) throw new NotFoundException('Membership not found');

    const updated = await this.prisma.ministryMembership.update({
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
        action: MINISTRY_AUDIT_ACTIONS.MEMBER_REMOVED,
        entity: MINISTRY_AUDIT_ENTITY,
        entityId: ministryId,
        oldValue: { memberId, status: membership.status },
        newValue: { status: 'REMOVED' },
      });
    }

    return updated;
  }

  async removeMember(actorUserId: string, ministryId: string, memberId: string) {
    return this.updateMember(actorUserId, ministryId, memberId, { status: 'REMOVED' });
  }

  async listLeadership(actorUserId: string, ministryId: string) {
    const actor = await this.access.resolveActor(actorUserId);
    await this.assertMinistryVisible(actorUserId, ministryId);
    if (!canViewMinistryLeadership(actor.permissions, actor.ministryScoped, ministryId)) {
      throw new ForbiddenException('Ministry leadership view denied');
    }

    const [current, history, positions] = await Promise.all([
      this.prisma.ministryLeadershipAssignment.findMany({
        where: { ministryId, endedAt: null },
        include: {
          member: { select: MEMBER_SELECT },
          position: true,
        },
        orderBy: { startedAt: 'asc' },
      }),
      this.prisma.ministryLeadershipAssignment.findMany({
        where: { ministryId, endedAt: { not: null } },
        include: {
          member: { select: MEMBER_SELECT },
          position: true,
        },
        orderBy: { endedAt: 'desc' },
        take: 100,
      }),
      this.prisma.ministryLeadershipPosition.findMany({
        where: { ministryId, isActive: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return { current, history, positions };
  }

  async assignLeadership(
    actorUserId: string,
    ministryId: string,
    dto: AssignMinistryLeadershipDto,
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    await this.assertMinistryVisible(actorUserId, ministryId);
    if (!canManageMinistryLeadership(actor.permissions, actor.ministryScoped, ministryId)) {
      throw new ForbiddenException('Ministry leadership management denied');
    }

    const position = await this.prisma.ministryLeadershipPosition.findFirst({
      where: { id: dto.positionId, ministryId, isActive: true },
    });
    if (!position) throw new NotFoundException('Leadership position not found');

    await this.prisma.member.findUniqueOrThrow({ where: { id: dto.memberId } });

    const assignment = await this.prisma.ministryLeadershipAssignment.create({
      data: {
        ministryId,
        memberId: dto.memberId,
        positionId: dto.positionId,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : new Date(),
        assignedByUserId: actorUserId,
      },
      include: {
        member: { select: MEMBER_SELECT },
        position: true,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_AUDIT_ACTIONS.LEADERSHIP_ASSIGNED,
      entity: MINISTRY_AUDIT_ENTITY,
      entityId: ministryId,
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
    ministryId: string,
    assignmentId: string,
    dto: EndMinistryLeadershipDto,
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    await this.assertMinistryVisible(actorUserId, ministryId);
    if (!canManageMinistryLeadership(actor.permissions, actor.ministryScoped, ministryId)) {
      throw new ForbiddenException('Ministry leadership management denied');
    }

    const assignment = await this.prisma.ministryLeadershipAssignment.findFirst({
      where: { id: assignmentId, ministryId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.endedAt) {
      throw new BadRequestException('Assignment already ended');
    }

    const ended = await this.prisma.ministryLeadershipAssignment.update({
      where: { id: assignmentId },
      data: { endedAt: dto.endedAt ? new Date(dto.endedAt) : new Date() },
      include: {
        member: { select: MEMBER_SELECT },
        position: true,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_AUDIT_ACTIONS.LEADERSHIP_ENDED,
      entity: MINISTRY_AUDIT_ENTITY,
      entityId: ministryId,
      oldValue: { assignmentId, endedAt: null },
      newValue: { assignmentId, endedAt: ended.endedAt },
    });

    return ended;
  }

  async listPermissions(actorUserId: string, ministryId: string) {
    const actor = await this.access.resolveActor(actorUserId);
    await this.assertMinistryVisible(actorUserId, ministryId);
    if (
      !canManageMinistryPermissions(actor.permissions, actor.ministryScoped, ministryId) &&
      !hasMinistryPermission(
        actor.permissions,
        actor.ministryScoped,
        ministryId,
        PERMISSIONS.MINISTRY_REPORTS_VIEW,
      )
    ) {
      throw new ForbiddenException('Ministry permissions view denied');
    }

    return this.prisma.ministryPermissionAssignment.findMany({
      where: { ministryId, revokedAt: null },
      include: {
        member: { select: MEMBER_SELECT },
        grantedBy: { select: { id: true, email: true } },
      },
      orderBy: { grantedAt: 'desc' },
    });
  }

  async grantPermission(
    actorUserId: string,
    ministryId: string,
    dto: GrantMinistryPermissionDto,
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    await this.assertMinistryVisible(actorUserId, ministryId);
    if (!canManageMinistryPermissions(actor.permissions, actor.ministryScoped, ministryId)) {
      throw new ForbiddenException('Ministry permission grant denied');
    }

    await this.prisma.member.findUniqueOrThrow({ where: { id: dto.memberId } });

    const active = await this.prisma.ministryPermissionAssignment.findFirst({
      where: {
        ministryId,
        memberId: dto.memberId,
        permission: dto.permission,
        revokedAt: null,
      },
    });
    if (active) {
      throw new BadRequestException('Permission already granted');
    }

    const assignment = await this.prisma.ministryPermissionAssignment.create({
      data: {
        ministryId,
        memberId: dto.memberId,
        permission: dto.permission,
        grantedByUserId: actorUserId,
      },
      include: { member: { select: MEMBER_SELECT } },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_AUDIT_ACTIONS.PERMISSION_GRANTED,
      entity: MINISTRY_AUDIT_ENTITY,
      entityId: ministryId,
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
    ministryId: string,
    assignmentId: string,
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    await this.assertMinistryVisible(actorUserId, ministryId);
    if (!canManageMinistryPermissions(actor.permissions, actor.ministryScoped, ministryId)) {
      throw new ForbiddenException('Ministry permission revoke denied');
    }

    const assignment = await this.prisma.ministryPermissionAssignment.findFirst({
      where: { id: assignmentId, ministryId, revokedAt: null },
    });
    if (!assignment) throw new NotFoundException('Permission assignment not found');

    const revoked = await this.prisma.ministryPermissionAssignment.update({
      where: { id: assignmentId },
      data: { revokedAt: new Date() },
      include: { member: { select: MEMBER_SELECT } },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_AUDIT_ACTIONS.PERMISSION_REVOKED,
      entity: MINISTRY_AUDIT_ENTITY,
      entityId: ministryId,
      oldValue: {
        assignmentId,
        permission: assignment.permission,
        memberId: assignment.memberId,
      },
    });

    return revoked;
  }

  async getSettings(actorUserId: string, ministryId: string) {
    const actor = await this.access.resolveActor(actorUserId);
    await this.assertMinistryVisible(actorUserId, ministryId);
    if (!canViewMinistrySettings(actor.permissions, actor.ministryScoped, ministryId)) {
      throw new ForbiddenException('Ministry settings view denied');
    }

    const ministry = await this.getMinistryOrThrow(ministryId);
    if (ministry.settings) return ministry.settings;

    return this.prisma.ministrySettings.create({
      data: { ministryId },
    });
  }

  async updateSettings(
    actorUserId: string,
    ministryId: string,
    dto: UpdateMinistrySettingsDto,
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    await this.assertMinistryVisible(actorUserId, ministryId);
    if (!canManageMinistrySettings(actor.permissions, actor.ministryScoped, ministryId)) {
      throw new ForbiddenException('Ministry settings management denied');
    }

    const existing = await this.getSettings(actorUserId, ministryId);
    const settings = await this.prisma.ministrySettings.upsert({
      where: { ministryId },
      create: { ministryId, ...dto },
      update: { ...dto },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_AUDIT_ACTIONS.SETTINGS_UPDATED,
      entity: MINISTRY_AUDIT_ENTITY,
      entityId: ministryId,
      oldValue: existing,
      newValue: settings,
    });

    return settings;
  }

  async listActivity(actorUserId: string, ministryId: string) {
    await this.assertMinistryVisible(actorUserId, ministryId);
    const actor = await this.access.resolveActor(actorUserId);
    if (!hasGlobalMinistryView(actor.permissions)) {
      throw new ForbiddenException('Ministry activity view denied');
    }

    return this.prisma.auditLog.findMany({
      where: { entity: MINISTRY_AUDIT_ENTITY, entityId: ministryId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { id: true, email: true } } },
    });
  }
}
