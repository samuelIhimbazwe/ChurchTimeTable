import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { AuditService } from '../audit/audit.service';
import { BusinessRuleException } from '../common/exceptions/business.exception';
import { NotificationsService } from '../notifications/notifications.service';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';
import { AttendanceOperationalStatus, PhysicalStatus, ReasonCategory } from '@prisma/client';

@Injectable()
export class AttendanceService {
  private lockHours: number;

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
    config: ConfigService,
  ) {
    this.lockHours = Number(config.get('ATTENDANCE_LOCK_HOURS', 48));
  }

  isLocked(record: { createdAt: Date; lockedAt: Date | null }): boolean {
    if (record.lockedAt) return true;
    const lockAt = new Date(record.createdAt);
    lockAt.setHours(lockAt.getHours() + this.lockHours);
    return new Date() > lockAt;
  }

  async upsert(dto: UpsertAttendanceDto, actorUserId: string) {
    const existing = await this.prisma.attendance.findUnique({
      where: {
        eventId_memberId: {
          eventId: dto.eventId,
          memberId: dto.memberId,
        },
      },
    });

    if (existing && this.isLocked(existing)) {
      throw new BusinessRuleException(
        'Attendance record is locked after 48 hours and cannot be modified',
      );
    }

    const data = {
      physicalStatus: dto.physicalStatus,
      reasonCategory: dto.reasonCategory,
      reasonType: dto.reasonType,
      notes: dto.notes,
      operationalStatus:
        dto.operationalStatus ??
        this.deriveOperationalStatus(dto.physicalStatus, dto.reasonCategory),
      approvedById:
        dto.reasonCategory === 'EXCUSED' ? actorUserId : undefined,
      clientUpdatedAt: dto.clientUpdatedAt
        ? new Date(dto.clientUpdatedAt)
        : new Date(),
    };

    const record = existing
      ? await this.prisma.attendance.update({
          where: { id: existing.id },
          data,
        })
      : await this.prisma.attendance.create({
          data: { eventId: dto.eventId, memberId: dto.memberId, ...data },
        });

    await this.audit.log({
      userId: actorUserId,
      action: existing ? 'ATTENDANCE_UPDATE' : 'ATTENDANCE_CREATE',
      entity: 'Attendance',
      entityId: record.id,
      oldValue: existing ?? undefined,
      newValue: record,
    });

    await this.notifications.notifyAttendanceUpdate(record);

    return record;
  }

  async findByEvent(eventId: string, page = 1, limit = 50) {
    const { skip, take } = paginate(page, limit);
    const [items, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { eventId },
        skip,
        take,
        include: { member: true },
      }),
      this.prisma.attendance.count({ where: { eventId } }),
    ]);
    return paginatedResult(items, total, page, limit);
  }

  async findByMember(memberId: string, page = 1, limit = 20) {
    const { skip, take } = paginate(page, limit);
    const [items, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { memberId },
        skip,
        take,
        include: { event: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.attendance.count({ where: { memberId } }),
    ]);
    return paginatedResult(items, total, page, limit);
  }

  async bulkUpsert(
    records: UpsertAttendanceDto[],
    actorUserId: string,
  ) {
    const results: Array<{
      memberId: string;
      status: 'ok' | 'error';
      error?: string;
    }> = [];

    for (const dto of records) {
      try {
        await this.upsert(dto, actorUserId);
        results.push({ memberId: dto.memberId, status: 'ok' });
      } catch (err) {
        results.push({
          memberId: dto.memberId,
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed',
        });
      }
    }

    return { results, applied: results.filter((r) => r.status === 'ok').length };
  }

  async approveExcused(
    attendanceId: string,
    approve: boolean,
    actorUserId: string,
  ) {
    const record = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
    });
    if (!record) throw new NotFoundException('Attendance not found');

    const updated = await this.prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        reasonCategory: approve ? 'EXCUSED' : 'UNEXCUSED',
        operationalStatus: approve
          ? AttendanceOperationalStatus.EXCUSED_ABSENCE
          : AttendanceOperationalStatus.UNEXCUSED_ABSENCE,
        approvedById: approve ? actorUserId : null,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: approve ? 'ATTENDANCE_EXCUSED_APPROVED' : 'ATTENDANCE_EXCUSED_REJECTED',
      entity: 'Attendance',
      entityId: attendanceId,
      oldValue: record,
      newValue: updated,
    });

    return updated;
  }

  async lockExpiredRecords() {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - this.lockHours);

    return this.prisma.attendance.updateMany({
      where: {
        lockedAt: null,
        createdAt: { lt: cutoff },
      },
      data: { lockedAt: new Date() },
    });
  }

  private deriveOperationalStatus(
    physicalStatus: PhysicalStatus,
    reasonCategory?: ReasonCategory,
  ): AttendanceOperationalStatus {
    if (physicalStatus === PhysicalStatus.PRESENT) {
      return AttendanceOperationalStatus.ATTENDED;
    }
    if (physicalStatus === PhysicalStatus.LATE) {
      return AttendanceOperationalStatus.LATE;
    }
    if (reasonCategory === ReasonCategory.EXCUSED) {
      return AttendanceOperationalStatus.EXCUSED_ABSENCE;
    }
    return AttendanceOperationalStatus.UNEXCUSED_ABSENCE;
  }
}
