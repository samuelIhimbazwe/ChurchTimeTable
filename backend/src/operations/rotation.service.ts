import { Injectable } from '@nestjs/common';
import { OperationAssignmentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AssignmentRecommendation = {
  assignmentType: OperationAssignmentType;
  operationalUnitId: string;
  operationalUnitName: string;
  operationalUnitCode: string;
  rotationScore: number;
  lastServedAt: string | null;
  timesServed: number;
  upcomingAssignments: number;
};

@Injectable()
export class RotationService {
  constructor(private prisma: PrismaService) {}

  async recommend(
    occurrenceId: string,
    assignmentType: OperationAssignmentType,
    limit = 5,
  ): Promise<AssignmentRecommendation[]> {
    const occurrence = await this.prisma.operationOccurrence.findUniqueOrThrow({
      where: { id: occurrenceId },
    });

    const units = await this.prisma.operationalUnit.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true, type: true },
    });

    const eligible = units.filter((u) =>
      this.unitMatchesType(u.code, u.type, assignmentType),
    );

    const now = new Date();
    const scored: AssignmentRecommendation[] = [];

    for (const unit of eligible) {
      const history = await this.prisma.operationAssignment.findMany({
        where: {
          operationalUnitId: unit.id,
          assignmentType,
          occurrence: {
            startAt: { lt: occurrence.startAt },
            status: { in: ['PUBLISHED', 'COMPLETED'] },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { occurrence: { select: { startAt: true } } },
      });

      const lastServedAt = history[0]?.occurrence.startAt ?? null;
      const timesServed = history.length;
      const upcomingAssignments = await this.prisma.operationAssignment.count({
        where: {
          operationalUnitId: unit.id,
          occurrence: {
            startAt: { gte: now },
            status: { in: ['APPROVED', 'PUBLISHED'] },
          },
        },
      });

      const daysSince =
        lastServedAt == null
          ? 365
          : (occurrence.startAt.getTime() - lastServedAt.getTime()) /
            86400000;
      const rotationScore = Math.round(
        daysSince * 2 - timesServed * 5 - upcomingAssignments * 10,
      );

      scored.push({
        assignmentType,
        operationalUnitId: unit.id,
        operationalUnitName: unit.name,
        operationalUnitCode: unit.code,
        rotationScore,
        lastServedAt: lastServedAt?.toISOString() ?? null,
        timesServed,
        upcomingAssignments,
      });
    }

    return scored
      .sort((a, b) => b.rotationScore - a.rotationScore)
      .slice(0, limit);
  }

  private unitMatchesType(
    code: string,
    type: string,
    assignmentType: OperationAssignmentType,
  ): boolean {
    if (assignmentType === 'MAIN_CHOIR') {
      return code === 'MAIN_CHOIR';
    }
    if (assignmentType === 'CHILDREN_CHOIR') {
      return code === 'CHILDREN_CHOIR';
    }
    if (assignmentType === 'PROTOCOL_TEAM') {
      return code === 'PROTOCOL_TEAM' || type === 'PROTOCOL_TEAM';
    }
    if (assignmentType === 'SERVICE_TEAM') {
      return type === 'SERVICE_TEAM' || code.includes('SERVICE');
    }
    return true;
  }
}
