import { ForbiddenException, Injectable } from '@nestjs/common';
import { ChoirSchedulePlanPeriod } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { CHOIR_SCHEDULING_AUDIT } from './choir-scheduling.constants';
import { hasChoirOpsSchedule } from './choir-scheduling-access.util';
import { ChoirServiceAssignmentsService } from './choir-service-assignments.service';

@Injectable()
export class ChoirSchedulePlansService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private assignments: ChoirServiceAssignmentsService,
  ) {}

  async generate(
    actorUserId: string,
    data: {
      label: string;
      periodType: ChoirSchedulePlanPeriod;
      year: number;
      month?: number;
      quarter?: number;
      startAt: string;
      endAt: string;
    },
  ) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (!hasChoirOpsSchedule(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }

    const plan = await this.prisma.choirSchedulePlan.create({
      data: {
        label: data.label,
        periodType: data.periodType,
        year: data.year,
        month: data.month,
        quarter: data.quarter,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        status: 'GENERATED',
        generatedAt: new Date(),
        generatedById: actorUserId,
      },
    });

    const occurrences = await this.prisma.operationOccurrence.findMany({
      where: {
        startAt: { gte: plan.startAt, lte: plan.endAt },
        status: { in: ['APPROVED', 'PUBLISHED', 'COMPLETED', 'DRAFT'] },
      },
      include: { template: true },
      orderBy: { startAt: 'asc' },
    });

    for (const occ of occurrences) {
      if (occ.type !== 'SERVICE' && occ.type !== 'SPECIAL_EVENT') continue;
      const assigned = await this.assignments.autoAssignForOccurrence(
        actorUserId,
        occ.id,
      );
      for (const a of assigned) {
        await this.prisma.choirSchedulePlanEntry.create({
          data: {
            planId: plan.id,
            occurrenceId: occ.id,
            choirId: a.choirId,
            role: a.role,
          },
        }).catch(() => undefined);
      }
    }

    await this.audit.log({
      userId: actorUserId,
      action: CHOIR_SCHEDULING_AUDIT.PLAN_GENERATED,
      entity: 'ChoirSchedulePlan',
      entityId: plan.id,
      newValue: { occurrenceCount: occurrences.length } as Prisma.InputJsonValue,
    });

    return this.get(plan.id);
  }

  async get(planId: string) {
    return this.prisma.choirSchedulePlan.findUniqueOrThrow({
      where: { id: planId },
      include: {
        entries: {
          include: {
            assignments: {
              include: {
                choir: { select: { name: true } },
                occurrence: { select: { title: true, startAt: true } },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async list(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (!hasChoirOpsSchedule(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }
    return this.prisma.choirSchedulePlan.findMany({
      orderBy: { startAt: 'desc' },
      take: 50,
    });
  }
}
