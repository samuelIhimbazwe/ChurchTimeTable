import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OperationsService } from './operations.service';
import { ServiceRulesService } from './service-rules.service';

@Injectable()
export class OperationsDashboardService {
  constructor(
    private prisma: PrismaService,
    private operations: OperationsService,
    private rules: ServiceRulesService,
  ) {}

  async summary(actorUserId: string) {
    const now = new Date();
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);

    const [
      upcoming,
      published,
      pendingConfirmations,
      occurrences,
    ] = await Promise.all([
      this.prisma.operationOccurrence.count({
        where: { startAt: { gte: now, lte: in30 }, status: { not: 'CANCELLED' } },
      }),
      this.prisma.operationOccurrence.count({
        where: { status: 'PUBLISHED', startAt: { gte: now } },
      }),
      this.prisma.operationAssignment.count({
        where: { status: 'PENDING', occurrence: { startAt: { gte: now } } },
      }),
      this.prisma.operationOccurrence.findMany({
        where: { startAt: { gte: now, lte: in30 } },
        include: { requirements: true, assignments: true, template: true },
        orderBy: { startAt: 'asc' },
        take: 10,
      }),
    ]);

    const missingAssignments = occurrences.filter((o) =>
      o.requirements.some((req) => {
        const count = o.assignments.filter(
          (a) => a.assignmentType === req.assignmentType,
        ).length;
        return req.required && count < req.quantity;
      }),
    ).length;

    let conflicts = 0;
    for (const o of occurrences.slice(0, 5)) {
      const list = await this.operations.listConflicts(actorUserId, o.id);
      conflicts += list.length;
    }

    const firstId = occurrences[0]?.id;
    const choirRotation = firstId
      ? await this.operations.recommendations(actorUserId, firstId, 'MAIN_CHOIR')
      : [];
    const protocolRotation = firstId
      ? await this.operations.recommendations(actorUserId, firstId, 'PROTOCOL_TEAM')
      : [];

    return {
      upcomingOperations: upcoming,
      publishedOperations: published,
      pendingConfirmations,
      missingAssignments,
      conflicts,
      upcoming: occurrences,
      choirRotation: choirRotation.slice(0, 3),
      protocolRotation: protocolRotation.slice(0, 3),
    };
  }
}
