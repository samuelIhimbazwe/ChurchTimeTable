import { BadRequestException, Injectable } from '@nestjs/common';
import { ChurchOperationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SYSTEM_OPERATION_TEMPLATES } from '../operations/operations.constants';

export type ChurchServiceSlotCode =
  | 'SUNDAY_SERVICE_1'
  | 'SUNDAY_SERVICE_2'
  | 'TUESDAY_SERVICE'
  | 'FRIDAY_SERVICE'
  | 'IGABURO'
  | 'OTHER';

const SLOT_LABELS: Record<Exclude<ChurchServiceSlotCode, 'OTHER'>, string> = {
  SUNDAY_SERVICE_1: 'Sunday Service I',
  SUNDAY_SERVICE_2: 'Sunday Service II',
  TUESDAY_SERVICE: 'Tuesday Service',
  FRIDAY_SERVICE: 'Friday Service',
  IGABURO: 'Igaburo',
};

function combineLocalDateTime(date: string, time: string): Date {
  const value = new Date(`${date}T${time}:00`);
  if (Number.isNaN(value.getTime())) {
    throw new BadRequestException('Invalid date or time');
  }
  return value;
}

@Injectable()
export class ChurchServiceOccurrenceService {
  constructor(private prisma: PrismaService) {}

  slotLabel(code: ChurchServiceSlotCode, customName?: string) {
    if (code === 'OTHER') {
      const name = customName?.trim();
      if (!name) throw new BadRequestException('Service name is required for Other');
      return name;
    }
    return SLOT_LABELS[code];
  }

  async resolveOrCreate(
    actorUserId: string,
    input: {
      serviceCode: ChurchServiceSlotCode;
      customServiceName?: string;
      serviceDate: string;
      startTime: string;
      endTime: string;
    },
  ) {
    const startAt = combineLocalDateTime(input.serviceDate, input.startTime);
    const endAt = combineLocalDateTime(input.serviceDate, input.endTime);
    if (endAt <= startAt) {
      throw new BadRequestException('End time must be after start time');
    }

    const title = this.slotLabel(input.serviceCode, input.customServiceName);
    let templateId: string | undefined;
    let type: ChurchOperationType = 'SERVICE';

    if (input.serviceCode !== 'OTHER') {
      const template = await this.prisma.operationTemplate.findFirst({
        where: { code: input.serviceCode, isActive: true },
      });
      if (!template) {
        const fallback = SYSTEM_OPERATION_TEMPLATES.find((t) => t.code === input.serviceCode);
        if (!fallback) throw new BadRequestException('Unknown service type');
      } else {
        templateId = template.id;
      }

      const existing = await this.prisma.operationOccurrence.findFirst({
        where: {
          ...(templateId ? { templateId } : { title }),
          startAt,
          endAt,
          cancelledAt: null,
          status: { not: 'CANCELLED' },
        },
      });
      if (existing) return existing;
    } else {
      type = 'SPECIAL_EVENT';
      const existing = await this.prisma.operationOccurrence.findFirst({
        where: {
          title,
          startAt,
          endAt,
          type: 'SPECIAL_EVENT',
          cancelledAt: null,
          status: { not: 'CANCELLED' },
        },
      });
      if (existing) return existing;
    }

    return this.prisma.operationOccurrence.create({
      data: {
        templateId,
        type,
        title,
        startAt,
        endAt,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        createdById: actorUserId,
      },
      include: { template: true },
    });
  }
}
