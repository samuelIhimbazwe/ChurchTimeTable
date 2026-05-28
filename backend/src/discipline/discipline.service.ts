import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DisciplineStage, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateDisciplineDto } from './dto/create-discipline.dto';
import { BusinessRuleException } from '../common/exceptions/business.exception';
import { NotificationsService } from '../notifications/notifications.service';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';

const STAGE_ORDER: DisciplineStage[] = [
  'REPORTED',
  'UNDER_REVIEW',
  'DECISION_PENDING',
  'ACTIONED',
  'CLOSED',
];

@Injectable()
export class DisciplineService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreateDisciplineDto, userId: string) {
    const record = await this.prisma.disciplineCase.create({
      data: {
        memberId: dto.memberId,
        ministry: dto.ministry,
        title: dto.title,
        description: dto.description,
        reporterId: dto.reporterId,
        stage: DisciplineStage.REPORTED,
      },
    });

    await this.audit.log({
      userId,
      action: 'DISCIPLINE_CREATE',
      entity: 'DisciplineCase',
      entityId: record.id,
      newValue: record,
    });

    await this.notifications.notifyDiscipline(record);
    return record;
  }

  async advanceStage(id: string, userId: string, resolution?: string, actionTaken?: string) {
    const record = await this.getOrThrow(id);
    const idx = STAGE_ORDER.indexOf(record.stage);
    if (idx < 0 || idx >= STAGE_ORDER.length - 1) {
      throw new BusinessRuleException('Case is already closed or cannot advance');
    }

    const nextStage = STAGE_ORDER[idx + 1];
    const updated = await this.prisma.disciplineCase.update({
      where: { id },
      data: {
        stage: nextStage,
        resolution: resolution ?? record.resolution,
        actionTaken: actionTaken ?? record.actionTaken,
        closedAt: nextStage === DisciplineStage.CLOSED ? new Date() : undefined,
      },
    });

    await this.audit.log({
      userId,
      action: 'DISCIPLINE_STAGE_ADVANCE',
      entity: 'DisciplineCase',
      entityId: id,
      oldValue: { stage: record.stage },
      newValue: { stage: nextStage },
    });

    return updated;
  }

  async findAll(
    page = 1,
    limit = 20,
    filters?: { memberId?: string; stage?: DisciplineStage },
    viewerMemberId?: string,
    canViewAll = false,
  ) {
    const { skip, take } = paginate(page, limit);
    const where: Prisma.DisciplineCaseWhereInput = {};

    if (!canViewAll) {
      if (!viewerMemberId) {
        throw new ForbiddenException('Access denied');
      }
      where.memberId = viewerMemberId;
    } else if (filters?.memberId) {
      where.memberId = filters.memberId;
    }

    if (filters?.stage) where.stage = filters.stage;

    const [items, total] = await Promise.all([
      this.prisma.disciplineCase.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { member: true },
      }),
      this.prisma.disciplineCase.count({ where }),
    ]);

    return paginatedResult(items, total, page, limit);
  }

  async findOne(id: string, viewerMemberId?: string, canViewAll = false) {
    const record = await this.getOrThrow(id);
    if (!canViewAll && record.memberId !== viewerMemberId) {
      throw new ForbiddenException('You can only view your own discipline cases');
    }
    return record;
  }

  private async getOrThrow(id: string) {
    const record = await this.prisma.disciplineCase.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Discipline case not found');
    return record;
  }
}
