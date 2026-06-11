import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AssignCommitteeMemberDto } from './dto/assign-committee-member.dto';
import { UpsertCommitteeRoleDto } from './dto/upsert-committee-role.dto';

@Injectable()
export class GovernanceService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async upsertChoirCommitteeRole(dto: UpsertCommitteeRoleDto, actorUserId: string) {
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
      newValue: role,
    });
    return role;
  }

  async assignChoirCommitteeMember(
    dto: AssignCommitteeMemberDto,
    actorUserId: string,
  ) {
    await this.ensureChoirRole(dto.roleId);
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
      },
      update: { assignedBy: actorUserId, assignedAt: new Date() },
      include: { role: true, member: true },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CHOIR_COMMITTEE_MEMBER_ASSIGN',
      entity: 'ChoirCommitteeMember',
      entityId: assignment.id,
      newValue: assignment,
    });
    return assignment;
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
}
