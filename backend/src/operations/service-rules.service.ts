import { BadRequestException, Injectable } from '@nestjs/common';
import {
  OperationAssignmentType,
  OperationOccurrenceStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type OperationConflict = {
  rule: string;
  message: string;
  occurrenceId?: string;
  operationalUnitId?: string;
};

@Injectable()
export class ServiceRulesService {
  constructor(private prisma: PrismaService) {}

  async validateAssignment(params: {
    occurrenceId: string;
    operationalUnitId: string;
    assignmentType: OperationAssignmentType;
    excludeAssignmentId?: string;
    override?: boolean;
  }): Promise<OperationConflict[]> {
    const conflicts: OperationConflict[] = [];
    const occurrence = await this.prisma.operationOccurrence.findUniqueOrThrow({
      where: { id: params.occurrenceId },
      include: { template: true },
    });

    const templateCode = occurrence.template?.code ?? null;
    const dayStart = new Date(occurrence.startAt);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // Rule 6: same unit twice on same occurrence
    const duplicateOnOccurrence = await this.prisma.operationAssignment.findFirst({
      where: {
        occurrenceId: params.occurrenceId,
        operationalUnitId: params.operationalUnitId,
        ...(params.excludeAssignmentId
          ? { id: { not: params.excludeAssignmentId } }
          : {}),
      },
    });
    if (duplicateOnOccurrence) {
      conflicts.push({
        rule: 'RULE_6',
        message: 'Operational unit is already assigned to this operation.',
        occurrenceId: params.occurrenceId,
        operationalUnitId: params.operationalUnitId,
      });
    }

    // Rule 2: CHILDREN_CHOIR only Sunday Service 1
    if (
      params.assignmentType === 'CHILDREN_CHOIR' &&
      templateCode !== 'SUNDAY_SERVICE_1'
    ) {
      conflicts.push({
        rule: 'RULE_2',
        message: 'Children choir may only serve Sunday Service 1.',
        occurrenceId: params.occurrenceId,
      });
    }

    // Rule 3: Tuesday max 1 MAIN_CHOIR
    if (
      templateCode === 'TUESDAY_SERVICE' &&
      params.assignmentType === 'MAIN_CHOIR'
    ) {
      const mainCount = await this.prisma.operationAssignment.count({
        where: {
          occurrenceId: params.occurrenceId,
          assignmentType: 'MAIN_CHOIR',
          ...(params.excludeAssignmentId
            ? { id: { not: params.excludeAssignmentId } }
            : {}),
        },
      });
      if (mainCount >= 1) {
        conflicts.push({
          rule: 'RULE_3',
          message: 'Tuesday Service allows at most one Main Choir assignment.',
          occurrenceId: params.occurrenceId,
        });
      }
    }

    // Rule 4: IGABURO max 1 MAIN_CHOIR
    if (templateCode === 'IGABURO' && params.assignmentType === 'MAIN_CHOIR') {
      const mainCount = await this.prisma.operationAssignment.count({
        where: {
          occurrenceId: params.occurrenceId,
          assignmentType: 'MAIN_CHOIR',
          ...(params.excludeAssignmentId
            ? { id: { not: params.excludeAssignmentId } }
            : {}),
        },
      });
      if (mainCount >= 1) {
        conflicts.push({
          rule: 'RULE_4',
          message: 'IGABURO allows at most one Main Choir assignment.',
          occurrenceId: params.occurrenceId,
        });
      }
    }

    // Rule 1: MAIN_CHOIR cannot serve S1 and S2 same day
    if (params.assignmentType === 'MAIN_CHOIR') {
      const sameDayOccurrences = await this.prisma.operationOccurrence.findMany({
        where: {
          startAt: { gte: dayStart, lt: dayEnd },
          status: {
            notIn: [
              OperationOccurrenceStatus.CANCELLED,
              OperationOccurrenceStatus.DRAFT,
            ],
          },
          template: { code: { in: ['SUNDAY_SERVICE_1', 'SUNDAY_SERVICE_2'] } },
        },
        include: {
          assignments: {
            where: {
              assignmentType: 'MAIN_CHOIR',
              operationalUnitId: params.operationalUnitId,
              ...(params.excludeAssignmentId
                ? { id: { not: params.excludeAssignmentId } }
                : {}),
            },
          },
          template: true,
        },
      });

      const currentCode = templateCode;
      for (const other of sameDayOccurrences) {
        if (other.id === params.occurrenceId) continue;
        if (!other.assignments.length) continue;
        const otherCode = other.template?.code;
        if (
          (currentCode === 'SUNDAY_SERVICE_1' &&
            otherCode === 'SUNDAY_SERVICE_2') ||
          (currentCode === 'SUNDAY_SERVICE_2' &&
            otherCode === 'SUNDAY_SERVICE_1')
        ) {
          conflicts.push({
            rule: 'RULE_1',
            message:
              'Main Choir cannot be assigned to both Sunday Service 1 and Sunday Service 2 on the same day.',
            occurrenceId: params.occurrenceId,
            operationalUnitId: params.operationalUnitId,
          });
          break;
        }
      }
    }

    // Rule 5: protocol team double-booked (overlapping time)
    if (params.assignmentType === 'PROTOCOL_TEAM') {
      const overlapping = await this.prisma.operationAssignment.findMany({
        where: {
          operationalUnitId: params.operationalUnitId,
          assignmentType: 'PROTOCOL_TEAM',
          occurrenceId: { not: params.occurrenceId },
          ...(params.excludeAssignmentId
            ? { id: { not: params.excludeAssignmentId } }
            : {}),
          occurrence: {
            status: {
              notIn: [
                OperationOccurrenceStatus.CANCELLED,
                OperationOccurrenceStatus.DRAFT,
              ],
            },
            startAt: { lt: occurrence.endAt },
            endAt: { gt: occurrence.startAt },
          },
        },
      });
      if (overlapping.length > 0) {
        conflicts.push({
          rule: 'RULE_5',
          message: 'Protocol team is already assigned to an overlapping operation.',
          operationalUnitId: params.operationalUnitId,
        });
      }
    }

    return conflicts;
  }

  assertNoConflicts(conflicts: OperationConflict[], override?: boolean) {
    if (override || conflicts.length === 0) return;
    throw new BadRequestException({
      message: 'Assignment violates service rules',
      conflicts,
    });
  }
}
