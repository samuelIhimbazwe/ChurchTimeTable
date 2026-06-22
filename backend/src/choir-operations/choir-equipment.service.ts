import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EquipmentAssignmentStatus, EquipmentCondition } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ChoirLogisticsAccessService } from './choir-logistics-access.service';

@Injectable()
export class ChoirEquipmentService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private logisticsAccess: ChoirLogisticsAccessService,
  ) {}

  async dashboard(userId: string, choirId?: string) {
    await this.logisticsAccess.requireViewEquipment(userId, choirId);

    const [assets, assignments, byCondition] = await Promise.all([
      this.prisma.equipmentAsset.findMany({
        include: {
          assignments: { where: { returnedAt: null }, take: 1 },
          maintenance: { orderBy: { performedAt: 'desc' }, take: 1 },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.equipmentAssignment.count({ where: { returnedAt: null } }),
      this.prisma.equipmentAsset.groupBy({ by: ['condition'], _count: true }),
    ]);

    const needsRepair =
      byCondition.find((r) => r.condition === 'OUT_OF_SERVICE')?._count ?? 0;
    const poor = byCondition.find((r) => r.condition === 'POOR')?._count ?? 0;

    return {
      total: assets.length,
      totalAssets: assets.length,
      activeAssignments: assignments,
      needsRepair,
      replacementNeeds: needsRepair + poor,
      items: assets,
      assets,
    };
  }

  async create(
    userId: string,
    dto: {
      choirId?: string;
      name: string;
      category?: string;
      serialNumber?: string;
      condition?: EquipmentCondition;
      notes?: string;
    },
    choirId?: string,
  ) {
    await this.logisticsAccess.requireManageEquipment(userId, choirId ?? dto.choirId);

    const row = await this.prisma.equipmentAsset.create({
      data: {
        choirId: dto.choirId ?? null,
        name: dto.name.trim(),
        category: dto.category?.trim(),
        serialNumber: dto.serialNumber?.trim(),
        condition: dto.condition ?? EquipmentCondition.GOOD,
        notes: dto.notes?.trim(),
      },
    });
    await this.audit.log({
      userId,
      action: 'CHOIR_EQUIPMENT_CREATED',
      entity: 'EquipmentAsset',
      entityId: row.id,
      newValue: row,
    });
    return row;
  }

  async assign(
    userId: string,
    equipmentId: string,
    dto: { memberId: string; notes?: string },
    choirId?: string,
  ) {
    await this.logisticsAccess.requireManageEquipment(userId, choirId);

    const asset = await this.prisma.equipmentAsset.findUnique({
      where: { id: equipmentId },
      include: { assignments: { where: { returnedAt: null } } },
    });
    if (!asset) throw new NotFoundException('Equipment not found');
    if (asset.assignments.length > 0) {
      throw new BadRequestException('Equipment already assigned');
    }

    const row = await this.prisma.equipmentAssignment.create({
      data: {
        equipmentId,
        memberId: dto.memberId,
        notes: dto.notes?.trim(),
        status: EquipmentAssignmentStatus.ASSIGNED,
      },
      include: { equipment: true, member: true },
    });
    await this.audit.log({
      userId,
      action: 'CHOIR_EQUIPMENT_ASSIGNED',
      entity: 'EquipmentAssignment',
      entityId: row.id,
      newValue: { equipmentId, memberId: dto.memberId },
    });
    return row;
  }

  async returnAssignment(
    userId: string,
    assignmentId: string,
    notes?: string,
    choirId?: string,
  ) {
    await this.logisticsAccess.requireManageEquipment(userId, choirId);

    const assignment = await this.prisma.equipmentAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.returnedAt) throw new BadRequestException('Already returned');

    const row = await this.prisma.equipmentAssignment.update({
      where: { id: assignmentId },
      data: {
        returnedAt: new Date(),
        status: EquipmentAssignmentStatus.RETURNED,
        notes: notes ?? assignment.notes,
      },
      include: { equipment: true, member: true },
    });
    await this.audit.log({
      userId,
      action: 'CHOIR_EQUIPMENT_RETURNED',
      entity: 'EquipmentAssignment',
      entityId: assignmentId,
      newValue: { equipmentId: assignment.equipmentId },
    });
    return row;
  }
}
