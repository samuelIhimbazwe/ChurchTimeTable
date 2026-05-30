import { Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceEscalationLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AttendanceEscalationService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  async escalate(
    attendanceId: string,
    level: AttendanceEscalationLevel,
    actorUserId: string,
    notes?: string,
  ) {
    const record = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        member: true,
        event: true,
      },
    });
    if (!record) {
      throw new NotFoundException('Attendance not found');
    }

    const updated = await this.prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        escalated: true,
        escalationLevel: level,
        escalationNotes: notes,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'ATTENDANCE_ESCALATED',
      entity: 'Attendance',
      entityId: attendanceId,
      newValue: { level, notes, eventId: record.eventId, memberId: record.memberId },
    });

    await this.notifications.notifyAttendanceEscalation({
      attendanceId,
      level,
      memberName: `${record.member.firstName} ${record.member.lastName}`,
      eventTitle: record.event.title,
      notes,
    });

    return updated;
  }

  async listEscalated(ministry?: 'PROTOCOL' | 'CHOIR') {
    const records = await this.prisma.attendance.findMany({
      where: {
        escalated: true,
        ...(ministry
          ? { event: { ministryScope: ministry === 'PROTOCOL' ? 'PROTOCOL' : 'CHOIR' } }
          : {}),
      },
      include: {
        member: true,
        event: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
    return records;
  }
}
