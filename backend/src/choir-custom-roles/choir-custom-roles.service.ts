import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ChoirRolesAccessService } from './choir-roles-access.service';
import type {
  AssignCustomRoleDto,
  CreateCustomRoleDto,
  UpdateCustomRoleDto,
} from './dto/custom-role.dto';

@Injectable()
export class ChoirCustomRolesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private rolesAccess: ChoirRolesAccessService,
  ) {}

  async list(userId: string, choirId: string, includeInactive = false) {
    await this.rolesAccess.requireManageCustomRole(userId, choirId);
    return this.prisma.choirCustomRole.findMany({
      where: {
        choirId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        permissions: true,
        assignments: {
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                memberNumber: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getById(userId: string, choirId: string, id: string) {
    await this.rolesAccess.requireManageCustomRole(userId, choirId);
    const row = await this.prisma.choirCustomRole.findFirst({
      where: { id, choirId },
      include: {
        permissions: true,
        assignments: {
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                memberNumber: true,
              },
            },
          },
        },
      },
    });
    if (!row) {
      throw new NotFoundException('Custom role not found');
    }
    return row;
  }

  async create(userId: string, choirId: string, dto: CreateCustomRoleDto) {
    await this.rolesAccess.requireManageCustomRole(userId, choirId);
    const existing = await this.prisma.choirCustomRole.findFirst({
      where: { choirId, name: dto.name },
    });
    if (existing) {
      throw new BadRequestException('Role name already exists');
    }

    const row = await this.prisma.choirCustomRole.create({
      data: {
        choirId,
        name: dto.name,
        description: dto.description,
        createdById: userId,
        permissions: dto.permissions?.length
          ? {
              create: dto.permissions.map((permission) => ({ permission })),
            }
          : undefined,
      },
      include: { permissions: true },
    });

    await this.audit.log({
      userId,
      action: 'choir_custom_role.create',
      entity: 'ChoirCustomRole',
      entityId: row.id,
      newValue: { name: row.name, permissions: dto.permissions },
    });

    return row;
  }

  async update(
    userId: string,
    choirId: string,
    id: string,
    dto: UpdateCustomRoleDto,
  ) {
    await this.rolesAccess.requireManageCustomRole(userId, choirId);
    await this.getById(userId, choirId, id);

    if (dto.permissions) {
      await this.prisma.choirCustomRolePermission.deleteMany({
        where: { roleId: id },
      });
      if (dto.permissions.length > 0) {
        await this.prisma.choirCustomRolePermission.createMany({
          data: dto.permissions.map((permission) => ({ roleId: id, permission })),
        });
      }
    }

    const row = await this.prisma.choirCustomRole.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: { permissions: true, assignments: true },
    });

    await this.audit.log({
      userId,
      action: dto.isActive === false ? 'choir_custom_role.deactivate' : 'choir_custom_role.update',
      entity: 'ChoirCustomRole',
      entityId: id,
      newValue: dto as Prisma.InputJsonValue,
    });

    return row;
  }

  async assignMember(
    userId: string,
    choirId: string,
    roleId: string,
    dto: AssignCustomRoleDto,
  ) {
    await this.rolesAccess.requireManageCustomRole(userId, choirId);
    await this.getById(userId, choirId, roleId);

    const assignment = await this.prisma.choirMemberCustomRole.upsert({
      where: {
        memberId_choirId_customRoleId: {
          memberId: dto.memberId,
          choirId,
          customRoleId: roleId,
        },
      },
      create: {
        memberId: dto.memberId,
        choirId,
        customRoleId: roleId,
        assignedById: userId,
      },
      update: { assignedById: userId, assignedAt: new Date() },
      include: {
        member: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    await this.audit.log({
      userId,
      action: 'choir_custom_role.assign',
      entity: 'ChoirMemberCustomRole',
      entityId: assignment.id,
      newValue: { memberId: dto.memberId, customRoleId: roleId },
    });

    return assignment;
  }

  async unassignMember(
    userId: string,
    choirId: string,
    roleId: string,
    memberId: string,
  ) {
    await this.rolesAccess.requireManageCustomRole(userId, choirId);
    await this.getById(userId, choirId, roleId);
    await this.prisma.choirMemberCustomRole.deleteMany({
      where: { choirId, customRoleId: roleId, memberId },
    });

    await this.audit.log({
      userId,
      action: 'choir_custom_role.unassign',
      entity: 'ChoirMemberCustomRole',
      newValue: { memberId, customRoleId: roleId },
    });

    return { ok: true };
  }

  async auditTrail(userId: string, choirId: string, roleId: string) {
    await this.rolesAccess.requireManageCustomRole(userId, choirId);
    await this.getById(userId, choirId, roleId);
    return this.prisma.auditLog.findMany({
      where: {
        entity: { in: ['ChoirCustomRole', 'ChoirMemberCustomRole'] },
        entityId: roleId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
