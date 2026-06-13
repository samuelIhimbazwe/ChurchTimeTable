import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AssignCommitteeMemberDto } from './dto/assign-committee-member.dto';
import { UpsertCommitteeRoleDto } from './dto/upsert-committee-role.dto';
import { ApplyChoirRoleTemplateDto } from './dto/apply-choir-role-template.dto';
import { CreateAdvisorElevationDto } from './dto/create-advisor-elevation.dto';
import {
  evaluateChoirMemberAssignmentSoD,
  evaluateChoirPermissionSoD,
} from '../common/governance/choir-sod-rules.util';
import { activeChoirCommitteeMemberWhere } from '../common/governance/choir-committee-member.util';

@Injectable()
export class GovernanceService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async upsertChoirCommitteeRole(dto: UpsertCommitteeRoleDto, actorUserId: string) {
    const sodWarnings = evaluateChoirPermissionSoD(dto.permissions, dto.name);

    const role = await this.prisma.choirCommitteeRole.upsert({
      where: { choirId_name: { choirId: dto.scopeId, name: dto.name } },
      create: {
        choirId: dto.scopeId,
        name: dto.name,
        permissionsJson: dto.permissions as Prisma.InputJsonValue,
      },
      update: {
        permissionsJson: dto.permissions as Prisma.InputJsonValue,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CHOIR_COMMITTEE_ROLE_UPSERT',
      entity: 'ChoirCommitteeRole',
      entityId: role.id,
      newValue: { role, sodWarnings },
    });
    return { role, sodWarnings };
  }

  checkChoirPermissionSoD(permissions: string[], roleName?: string) {
    return {
      warnings: evaluateChoirPermissionSoD(permissions, roleName),
    };
  }

  async assignChoirCommitteeMember(
    dto: AssignCommitteeMemberDto,
    actorUserId: string,
  ) {
    await this.ensureChoirRole(dto.roleId);
    const assignedAt = dto.effectiveStart ? new Date(dto.effectiveStart) : new Date();
    const assignment = await this.prisma.choirCommitteeMember.upsert({
      where: {
        choirId_memberId_roleId: {
          choirId: dto.scopeId,
          memberId: dto.memberId,
          roleId: dto.roleId,
        },
      },
      create: {
        choirId: dto.scopeId,
        memberId: dto.memberId,
        roleId: dto.roleId,
        assignedBy: actorUserId,
        assignedAt,
        effectiveEnd: null,
      },
      update: {
        assignedBy: actorUserId,
        assignedAt,
        effectiveEnd: null,
      },
      include: { role: true, member: true },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CHOIR_COMMITTEE_MEMBER_ASSIGN',
      entity: 'ChoirCommitteeMember',
      entityId: assignment.id,
      newValue: assignment,
    });

    const memberRoles = await this.prisma.choirCommitteeMember.findMany({
      where: {
        choirId: dto.scopeId,
        memberId: dto.memberId,
        ...activeChoirCommitteeMemberWhere(),
      },
      include: { role: true },
    });
    const sodWarnings = evaluateChoirMemberAssignmentSoD(
      memberRoles.map((row) => row.role.name),
    );

    return { assignment, sodWarnings };
  }

  async upsertProtocolCommitteeRole(dto: UpsertCommitteeRoleDto, actorUserId: string) {
    const role = await this.prisma.protocolCommitteeRole.upsert({
      where: { ministryId_name: { ministryId: dto.scopeId, name: dto.name } },
      create: {
        ministryId: dto.scopeId,
        name: dto.name,
        permissionsJson: dto.permissions as Prisma.InputJsonValue,
      },
      update: {
        permissionsJson: dto.permissions as Prisma.InputJsonValue,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'PROTOCOL_COMMITTEE_ROLE_UPSERT',
      entity: 'ProtocolCommitteeRole',
      entityId: role.id,
      newValue: role,
    });
    return role;
  }

  async assignProtocolCommitteeMember(
    dto: AssignCommitteeMemberDto,
    actorUserId: string,
  ) {
    await this.ensureProtocolRole(dto.roleId);
    const assignment = await this.prisma.protocolCommitteeMember.upsert({
      where: {
        ministryId_memberId_roleId: {
          ministryId: dto.scopeId,
          memberId: dto.memberId,
          roleId: dto.roleId,
        },
      },
      create: {
        ministryId: dto.scopeId,
        memberId: dto.memberId,
        roleId: dto.roleId,
        assignedBy: actorUserId,
      },
      update: { assignedBy: actorUserId, assignedAt: new Date() },
      include: { role: true, member: true },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'PROTOCOL_COMMITTEE_MEMBER_ASSIGN',
      entity: 'ProtocolCommitteeMember',
      entityId: assignment.id,
      newValue: assignment,
    });
    return assignment;
  }

  async listChoirCommittee(scopeId: string) {
    const [roles, members] = await Promise.all([
      this.prisma.choirCommitteeRole.findMany({
        where: { choirId: scopeId },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.choirCommitteeMember.findMany({
        where: { choirId: scopeId },
        include: { role: true, member: true },
        orderBy: { assignedAt: 'desc' },
      }),
    ]);
    return { roles, members };
  }

  async listChoirRoleTemplates() {
    const rows = await this.prisma.choirCommitteeRoleTemplate.findMany({
      orderBy: { label: 'asc' },
    });
    return {
      templates: rows.map((row) => ({
        id: row.id,
        name: row.name,
        label: row.label,
        description: row.description,
        permissions: this.parsePermissionsJson(row.permissionsJson),
        permissionCount: this.parsePermissionsJson(row.permissionsJson).length,
      })),
    };
  }

  async applyChoirRoleTemplate(
    templateId: string,
    dto: ApplyChoirRoleTemplateDto,
    actorUserId: string,
  ) {
    const template = await this.prisma.choirCommitteeRoleTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) {
      throw new NotFoundException('Role template not found');
    }

    const permissions = this.parsePermissionsJson(template.permissionsJson);
    const roleName = dto.roleName?.trim() || template.name;
    const sodWarnings = evaluateChoirPermissionSoD(permissions, roleName);

    const role = await this.prisma.choirCommitteeRole.upsert({
      where: { choirId_name: { choirId: dto.scopeId, name: roleName } },
      create: {
        choirId: dto.scopeId,
        name: roleName,
        permissionsJson: permissions as Prisma.InputJsonValue,
      },
      update: {
        permissionsJson: permissions as Prisma.InputJsonValue,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CHOIR_ROLE_TEMPLATE_APPLY',
      entity: 'ChoirCommitteeRole',
      entityId: role.id,
      newValue: { templateId, templateName: template.name, roleName, sodWarnings },
    });

    return { role, sodWarnings, template: { id: template.id, name: template.name, label: template.label } };
  }

  async createAdvisorElevation(dto: CreateAdvisorElevationDto, actorUserId: string) {
    const durationDays = dto.durationDays ?? 7;
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const member = await this.prisma.member.findUnique({
      where: { id: dto.memberId },
      select: { id: true },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const sodWarnings = evaluateChoirPermissionSoD(dto.permissions, 'advisor_elevation');
    const elevation = await this.prisma.choirAdvisorElevation.create({
      data: {
        choirId: dto.scopeId,
        memberId: dto.memberId,
        permissionsJson: dto.permissions as Prisma.InputJsonValue,
        reason: dto.reason?.trim() || null,
        startsAt,
        endsAt,
        grantedByUserId: actorUserId,
      },
      include: {
        member: { select: { firstName: true, lastName: true, memberNumber: true } },
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CHOIR_ADVISOR_ELEVATION_CREATE',
      entity: 'ChoirAdvisorElevation',
      entityId: elevation.id,
      newValue: { elevation, sodWarnings },
    });

    return {
      elevation: this.serializeElevation(elevation),
      sodWarnings,
    };
  }

  async listAdvisorElevations(choirId: string, activeOnly = true) {
    const now = new Date();
    const rows = await this.prisma.choirAdvisorElevation.findMany({
      where: {
        choirId,
        ...(activeOnly
          ? {
              revokedAt: null,
              startsAt: { lte: now },
              endsAt: { gt: now },
            }
          : {}),
      },
      orderBy: [{ endsAt: 'asc' }, { createdAt: 'desc' }],
      take: 50,
      include: {
        member: { select: { firstName: true, lastName: true, memberNumber: true } },
      },
    });
    return { items: rows.map((row) => this.serializeElevation(row)) };
  }

  async revokeAdvisorElevation(elevationId: string, actorUserId: string) {
    const elevation = await this.prisma.choirAdvisorElevation.findUniqueOrThrow({
      where: { id: elevationId },
    });
    const revokedAt = new Date();
    const updated = await this.prisma.choirAdvisorElevation.update({
      where: { id: elevationId },
      data: { revokedAt },
      include: {
        member: { select: { firstName: true, lastName: true, memberNumber: true } },
      },
    });
    await this.audit.log({
      userId: actorUserId,
      action: 'CHOIR_ADVISOR_ELEVATION_REVOKE',
      entity: 'ChoirAdvisorElevation',
      entityId: elevationId,
      oldValue: elevation,
      newValue: updated,
    });
    return { revoked: true, elevation: this.serializeElevation(updated) };
  }

  async revokeChoirCommitteeMember(
    assignmentId: string,
    actorUserId: string,
    effectiveEnd?: string,
  ) {
    const assignment = await this.prisma.choirCommitteeMember.findUniqueOrThrow({
      where: { id: assignmentId },
      include: { role: true, member: true },
    });
    const endedAt = effectiveEnd ? new Date(effectiveEnd) : new Date();
    const updated = await this.prisma.choirCommitteeMember.update({
      where: { id: assignmentId },
      data: { effectiveEnd: endedAt },
      include: { role: true, member: true },
    });
    await this.audit.log({
      userId: actorUserId,
      action: 'CHOIR_COMMITTEE_MEMBER_REVOKE',
      entity: 'ChoirCommitteeMember',
      entityId: assignmentId,
      oldValue: assignment,
      newValue: updated,
    });
    return { revoked: true, id: assignmentId, effectiveEnd: endedAt.toISOString() };
  }

  async revokeProtocolCommitteeMember(
    assignmentId: string,
    actorUserId: string,
  ) {
    const assignment = await this.prisma.protocolCommitteeMember.findUniqueOrThrow({
      where: { id: assignmentId },
      include: { role: true, member: true },
    });
    await this.prisma.protocolCommitteeMember.delete({
      where: { id: assignmentId },
    });
    await this.audit.log({
      userId: actorUserId,
      action: 'PROTOCOL_COMMITTEE_MEMBER_REVOKE',
      entity: 'ProtocolCommitteeMember',
      entityId: assignmentId,
      oldValue: assignment,
    });
    return { revoked: true, id: assignmentId };
  }

  async listProtocolCommittee(scopeId: string) {
    const [roles, members] = await Promise.all([
      this.prisma.protocolCommitteeRole.findMany({
        where: { ministryId: scopeId },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.protocolCommitteeMember.findMany({
        where: { ministryId: scopeId },
        include: { role: true, member: true },
        orderBy: { assignedAt: 'desc' },
      }),
    ]);
    return { roles, members };
  }

  private async ensureChoirRole(roleId: string) {
    const role = await this.prisma.choirCommitteeRole.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Choir committee role not found');
    }
  }

  private async ensureProtocolRole(roleId: string) {
    const role = await this.prisma.protocolCommitteeRole.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException('Protocol committee role not found');
    }
  }

  private parsePermissionsJson(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
  }

  private serializeElevation(
    row: {
      id: string;
      choirId: string;
      memberId: string;
      permissionsJson: unknown;
      reason: string | null;
      startsAt: Date;
      endsAt: Date;
      revokedAt: Date | null;
      createdAt: Date;
      member?: { firstName: string; lastName: string; memberNumber: string | null };
    },
  ) {
    const permissions = this.parsePermissionsJson(row.permissionsJson);
    const memberName = row.member
      ? `${row.member.firstName} ${row.member.lastName}`.trim()
      : null;
    return {
      id: row.id,
      choirId: row.choirId,
      memberId: row.memberId,
      memberName,
      memberNumber: row.member?.memberNumber ?? null,
      permissions,
      reason: row.reason,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      revokedAt: row.revokedAt?.toISOString() ?? null,
      isActive:
        !row.revokedAt &&
        row.startsAt <= new Date() &&
        row.endsAt > new Date(),
      createdAt: row.createdAt.toISOString(),
    };
  }
}
