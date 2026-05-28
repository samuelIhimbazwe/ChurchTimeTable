import { Injectable, NotFoundException } from '@nestjs/common';
import { EventType, MemberStatus, MinistryScope } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { AuditService } from '../audit/audit.service';

const ROTATION_KEY = 'choir_rotation_last_member_id';
const DEFAULT_COUNT = 20;

@Injectable()
export class ChoirRotationService {
  constructor(
    private prisma: PrismaService,
    private assignments: AssignmentsService,
    private audit: AuditService,
  ) {}

  async getPool(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const members = await this.prisma.member.findMany({
      where: {
        status: MemberStatus.ACTIVE,
        ministry: { in: [MinistryScope.CHOIR, MinistryScope.BOTH] },
        ...(event.serviceSlot === 1 ? { isChildrenChoir: true } : {}),
      },
      orderBy: [{ serviceNumber: 'asc' }, { lastName: 'asc' }],
    });

    return { event, members, total: members.length };
  }

  async autoAssign(
    eventId: string,
    actorUserId: string,
    count = DEFAULT_COUNT,
  ) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    if (
      event.type !== EventType.CHOIR_SERVICE &&
      event.type !== EventType.REHEARSAL
    ) {
      throw new NotFoundException('Rotation applies to choir events only');
    }

    const pool = (
      await this.getPool(eventId)
    ).members;
    if (!pool.length) {
      return { assigned: [], message: 'No eligible choir members' };
    }

    const cursor = await this.prisma.systemSetting.findUnique({
      where: { key: ROTATION_KEY },
    });
    const lastId = (cursor?.value as { memberId?: string })?.memberId;
    let startIdx = 0;
    if (lastId) {
      const idx = pool.findIndex((m) => m.id === lastId);
      startIdx = idx >= 0 ? (idx + 1) % pool.length : 0;
    }

    const assigned: string[] = [];
    let idx = startIdx;
    let attempts = 0;

    while (assigned.length < count && attempts < pool.length * 2) {
      const member = pool[idx % pool.length];
      attempts++;
      idx++;

      try {
        await this.assignments.assign(
          { eventId, memberId: member.id },
          actorUserId,
        );
        assigned.push(member.id);
      } catch {
        // skip conflicts / quota — continue rotation
      }
    }

    if (assigned.length) {
      const lastAssigned = assigned[assigned.length - 1];
      await this.prisma.systemSetting.upsert({
        where: { key: ROTATION_KEY },
        create: { key: ROTATION_KEY, value: { memberId: lastAssigned } },
        update: { value: { memberId: lastAssigned } },
      });
    }

    await this.audit.log({
      userId: actorUserId,
      action: 'CHOIR_ROTATION_ASSIGN',
      entity: 'Event',
      entityId: eventId,
      newValue: { assignedCount: assigned.length, memberIds: assigned },
    });

    return { assigned, count: assigned.length, poolSize: pool.length };
  }
}
