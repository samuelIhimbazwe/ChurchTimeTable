import { Injectable, NotFoundException } from '@nestjs/common';
import { ActionItemStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { assertChoirOpsManage, assertChoirOpsView } from './choir-operations.util';

@Injectable()
export class ChoirMeetingsService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
  ) {}

  async list(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    assertChoirOpsView(resolved.permissions, PERMISSIONS.CHOIR_MEETING_MANAGE);
    return this.prisma.choirMeeting.findMany({
      orderBy: { scheduledAt: 'desc' },
      include: {
        _count: { select: { attendees: true, actionItems: true, decisions: true } },
      },
    });
  }

  async get(userId: string, id: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    assertChoirOpsView(resolved.permissions, PERMISSIONS.CHOIR_MEETING_MANAGE);
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

  async reports(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    assertChoirOpsView(resolved.permissions, PERMISSIONS.CHOIR_MEETING_MANAGE);
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
  ) {
    const resolved = await this.permissions.resolveForUser(userId);
    assertChoirOpsManage(resolved.permissions, PERMISSIONS.CHOIR_MEETING_MANAGE);
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
