import { Injectable, NotFoundException } from '@nestjs/common';
import { EventType, MinistryScope, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AuditService } from '../audit/audit.service';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateEventDto, userId: string) {
    const metadata = this.buildMetadata(dto);
    const event = await this.prisma.event.create({
      data: {
        title: dto.title,
        type: dto.type,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        location: dto.location,
        ministryScope: dto.ministryScope,
        status: dto.status,
        serviceSlot: dto.serviceSlot,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });

    await this.audit.log({
      userId,
      action: 'EVENT_CREATE',
      entity: 'Event',
      entityId: event.id,
      newValue: event,
    });

    return event;
  }

  async update(id: string, dto: UpdateEventDto, userId: string) {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Event not found');

    const event = await this.prisma.event.update({
      where: { id },
      data: {
        ...dto,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      },
    });

    await this.audit.log({
      userId,
      action: 'EVENT_UPDATE',
      entity: 'Event',
      entityId: id,
      oldValue: existing,
      newValue: event,
    });

    return event;
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        assignments: { include: { member: true } },
        attendances: { include: { member: true } },
        _count: { select: { attendances: true, assignments: true } },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  private buildMetadata(dto: CreateEventDto): Record<string, unknown> | undefined {
    const meta: Record<string, unknown> = {};
    if (dto.description) meta.description = dto.description;
    if (dto.recurrenceRule) meta.recurrenceRule = dto.recurrenceRule;
    return Object.keys(meta).length ? meta : undefined;
  }

  async findAll(
    page = 1,
    limit = 20,
    filters?: {
      type?: EventType;
      ministryScope?: MinistryScope;
      from?: string;
      to?: string;
    },
  ) {
    const { skip, take } = paginate(page, limit);
    const where: Prisma.EventWhereInput = {};

    if (filters?.type) where.type = filters.type;
    if (filters?.ministryScope) where.ministryScope = filters.ministryScope;
    if (filters?.from || filters?.to) {
      where.startTime = {};
      if (filters.from) where.startTime.gte = new Date(filters.from);
      if (filters.to) where.startTime.lte = new Date(filters.to);
    }

    const [items, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take,
        orderBy: { startTime: 'asc' },
        include: { _count: { select: { assignments: true } } },
      }),
      this.prisma.event.count({ where }),
    ]);

    return paginatedResult(items, total, page, limit);
  }

  async cancel(id: string, userId: string) {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Event not found');

    const event = await this.prisma.event.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await this.audit.log({
      userId,
      action: 'EVENT_CANCEL',
      entity: 'Event',
      entityId: id,
      oldValue: existing,
      newValue: event,
    });

    return event;
  }
}
