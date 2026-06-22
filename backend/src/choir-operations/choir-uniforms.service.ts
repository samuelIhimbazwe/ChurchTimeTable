import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UniformItemStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ChoirLogisticsAccessService } from './choir-logistics-access.service';

@Injectable()
export class ChoirUniformsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private logisticsAccess: ChoirLogisticsAccessService,
  ) {}

  async dashboard(userId: string, choirId?: string) {
    await this.logisticsAccess.requireViewUniforms(userId, choirId);

    const [items, assignments, byStatus] = await Promise.all([
      this.prisma.uniformItem.count(),
      this.prisma.uniformAssignment.findMany({
        where: { returnedAt: null },
        include: { item: true, member: true },
        take: 50,
      }),
      this.prisma.uniformItem.groupBy({ by: ['status'], _count: true }),
    ]);

    const missing = assignments.filter(
      (a) => a.returnedAt == null && a.item.status === 'LOST',
    ).length;
    const damaged = byStatus.find((r) => r.status === 'DAMAGED')?._count ?? 0;

    return {
      total: items,
      totalItems: items,
      activeAssignments: assignments.length,
      missing,
      damaged,
      replacementNeeds: missing + damaged,
      items: assignments,
      assignments,
    };
  }

  async listTypes(userId: string, choirId?: string) {
    await this.logisticsAccess.requireViewUniforms(userId, choirId);
    return this.prisma.uniformType.findMany({
      include: { items: true },
      orderBy: { name: 'asc' },
    });
  }

  async createType(
    userId: string,
    dto: { choirId?: string; code: string; name: string; description?: string },
    choirId?: string,
  ) {
    await this.logisticsAccess.requireManageUniforms(userId, choirId ?? dto.choirId);
    const row = await this.prisma.uniformType.create({
      data: {
        choirId: dto.choirId ?? null,
        code: dto.code.trim(),
        name: dto.name.trim(),
        description: dto.description?.trim(),
      },
    });
    await this.audit.log({
      userId,
      action: 'CHOIR_UNIFORM_TYPE_CREATED',
      entity: 'UniformType',
      entityId: row.id,
      newValue: row,
    });
    return row;
  }

  async createItem(
    userId: string,
    dto: {
      uniformTypeId: string;
      label: string;
      size?: string;
      condition?: string;
    },
    choirId?: string,
  ) {
    await this.logisticsAccess.requireManageUniforms(userId, choirId);
    const type = await this.prisma.uniformType.findUnique({
      where: { id: dto.uniformTypeId },
    });
    if (!type) throw new NotFoundException('Uniform type not found');

    const row = await this.prisma.uniformItem.create({
      data: {
        uniformTypeId: dto.uniformTypeId,
        label: dto.label.trim(),
        size: dto.size?.trim(),
        condition: dto.condition?.trim(),
        status: UniformItemStatus.AVAILABLE,
      },
    });
    await this.audit.log({
      userId,
      action: 'CHOIR_UNIFORM_ITEM_CREATED',
      entity: 'UniformItem',
      entityId: row.id,
      newValue: row,
    });
    return row;
  }

  async issueUniform(
    userId: string,
    dto: { uniformItemId: string; memberId: string; notes?: string },
    choirId?: string,
  ) {
    await this.logisticsAccess.requireManageUniforms(userId, choirId);

    const item = await this.prisma.uniformItem.findUnique({
      where: { id: dto.uniformItemId },
      include: { assignments: { where: { returnedAt: null } } },
    });
    if (!item) throw new NotFoundException('Uniform item not found');
    if (item.status !== UniformItemStatus.AVAILABLE || item.assignments.length > 0) {
      throw new BadRequestException('Uniform item is not available');
    }

    const assignment = await this.prisma.$transaction(async (tx) => {
      const row = await tx.uniformAssignment.create({
        data: {
          uniformItemId: dto.uniformItemId,
          memberId: dto.memberId,
          notes: dto.notes?.trim(),
        },
        include: { item: true, member: true },
      });
      await tx.uniformItem.update({
        where: { id: dto.uniformItemId },
        data: { status: UniformItemStatus.ASSIGNED },
      });
      return row;
    });

    await this.audit.log({
      userId,
      action: 'CHOIR_UNIFORM_ISSUED',
      entity: 'UniformAssignment',
      entityId: assignment.id,
      newValue: { uniformItemId: dto.uniformItemId, memberId: dto.memberId },
    });
    return assignment;
  }

  async returnUniform(
    userId: string,
    assignmentId: string,
    notes?: string,
    choirId?: string,
  ) {
    await this.logisticsAccess.requireManageUniforms(userId, choirId);

    const assignment = await this.prisma.uniformAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.returnedAt) throw new BadRequestException('Already returned');

    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.uniformAssignment.update({
        where: { id: assignmentId },
        data: { returnedAt: new Date(), notes: notes ?? assignment.notes },
        include: { item: true, member: true },
      });
      await tx.uniformItem.update({
        where: { id: assignment.uniformItemId },
        data: { status: UniformItemStatus.AVAILABLE },
      });
      return updated;
    });

    await this.audit.log({
      userId,
      action: 'CHOIR_UNIFORM_RETURNED',
      entity: 'UniformAssignment',
      entityId: assignmentId,
      newValue: { uniformItemId: assignment.uniformItemId },
    });
    return row;
  }
}
