import { Injectable, NotFoundException } from '@nestjs/common';
import { ActionItemStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChoirCommsAccessService } from './choir-comms-access.service';

@Injectable()
export class ChoirMeetingsService {
  constructor(
    private prisma: PrismaService,
    private commsAccess: ChoirCommsAccessService,
  ) {}

  async list(userId: string, choirId?: string) {
    await this.commsAccess.requireViewMeetings(userId, choirId);
    return this.prisma.choirMeeting.findMany({
      orderBy: { scheduledAt: 'desc' },
      include: {
        _count: { select: { attendees: true, actionItems: true, decisions: true } },
      },
    });
  }

  async get(userId: string, id: string, choirId?: string) {
    await this.commsAccess.requireViewMeetings(userId, choirId);
    const row = await this.prisma.choirMeeting.findUnique({
      where: { id },
      include: {
        attendees: { include: { member: true } },
        decisions: true,
        actionItems: { include: { owner: true } },
      },
    });
    if (!row) throw new NotFoundException('Not found');
    return row;
  }

  async reports(userId: string, choirId?: string) {
    await this.commsAccess.requireViewMeetings(userId, choirId);
    const [open, overdue, completed] = await Promise.all([
      this.prisma.meetingActionItem.count({
        where: { status: ActionItemStatus.OPEN },
      }),
      this.prisma.meetingActionItem.count({
        where: {
          status: ActionItemStatus.OPEN,
          dueAt: { lt: new Date() },
        },
      }),
      this.prisma.meetingActionItem.count({
        where: { status: ActionItemStatus.DONE },
      }),
    ]);
    return { open, overdue, completed };
  }

  async create(
    userId: string,
    dto: { title: string; scheduledAt: string; location?: string; agenda?: string },
    choirId?: string,
  ) {
    await this.commsAccess.requireManageMeetings(userId, choirId);
    return this.prisma.choirMeeting.create({
      data: {
        title: dto.title,
        scheduledAt: new Date(dto.scheduledAt),
        location: dto.location,
        agenda: dto.agenda,
        createdByUserId: userId,
      },
    });
  }
}
