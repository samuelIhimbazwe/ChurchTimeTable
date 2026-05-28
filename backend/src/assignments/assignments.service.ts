import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictDetectionService } from './conflict-detection.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    private prisma: PrismaService,
    private conflict: ConflictDetectionService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  async validateOnly(dto: CreateAssignmentDto) {
    await this.conflict.validateAssignment({
      eventId: dto.eventId,
      memberId: dto.memberId,
      isOverride: dto.isOverride,
      overrideReason: dto.overrideReason,
    });
  }

  async assign(dto: CreateAssignmentDto, actorUserId: string) {
    await this.conflict.validateAssignment({
      eventId: dto.eventId,
      memberId: dto.memberId,
      isOverride: dto.isOverride,
      overrideReason: dto.overrideReason,
    });

    const assignment = await this.prisma.eventAssignment.create({
      data: {
        eventId: dto.eventId,
        memberId: dto.memberId,
        role: dto.role,
        isOverride: dto.isOverride ?? false,
        overrideReason: dto.overrideReason,
        overrideById: dto.isOverride ? actorUserId : undefined,
      },
      include: {
        event: true,
        member: { include: { user: true } },
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'ASSIGNMENT_CREATE',
      entity: 'EventAssignment',
      entityId: assignment.id,
      newValue: assignment,
    });

    await this.notifications.notifyMemberAssignment(assignment);

    return assignment;
  }

  async remove(assignmentId: string, actorUserId: string) {
    const existing = await this.prisma.eventAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!existing) {
      throw new NotFoundException('Assignment not found');
    }

    await this.prisma.eventAssignment.delete({ where: { id: assignmentId } });

    await this.audit.log({
      userId: actorUserId,
      action: 'ASSIGNMENT_DELETE',
      entity: 'EventAssignment',
      entityId: assignmentId,
      oldValue: existing,
    });

    return { deleted: true };
  }

  async findByEvent(eventId: string, page = 1, limit = 50) {
    const { skip, take } = paginate(page, limit);
    const [items, total] = await Promise.all([
      this.prisma.eventAssignment.findMany({
        where: { eventId },
        skip,
        take,
        include: { member: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.eventAssignment.count({ where: { eventId } }),
    ]);
    return paginatedResult(items, total, page, limit);
  }

  async bulkAssign(
    assignments: CreateAssignmentDto[],
    actorUserId: string,
  ) {
    const results: Array<{
      memberId: string;
      eventId: string;
      status: 'ok' | 'error';
      error?: string;
    }> = [];

    for (const dto of assignments) {
      try {
        await this.assign(dto, actorUserId);
        results.push({
          memberId: dto.memberId,
          eventId: dto.eventId,
          status: 'ok',
        });
      } catch (err) {
        results.push({
          memberId: dto.memberId,
          eventId: dto.eventId,
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed',
        });
      }
    }

    return { results };
  }
}
