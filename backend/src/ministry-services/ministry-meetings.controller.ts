import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { MinistryMeetingsService } from './ministry-meetings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireAnyPermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import {
  CreateMinistryMeetingDto,
  CreateMeetingActionItemDto,
  RecordMeetingAttendeeDto,
  UpdateMinistryMeetingDto,
} from './dto/ministry-meeting.dto';

@Controller('ministries/:ministryId/meetings')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class MinistryMeetingsController {
  constructor(private service: MinistryMeetingsService) {}

  @Get()
  @RequireAnyPermissions(PERMISSIONS.MINISTRY_MEETING_VIEW, PERMISSIONS.MINISTRY_MANAGE)
  list(@CurrentUser() user: JwtPayload, @Param('ministryId') ministryId: string) {
    return this.service.list(user.sub, ministryId);
  }

  @Get(':id')
  @RequireAnyPermissions(PERMISSIONS.MINISTRY_MEETING_VIEW, PERMISSIONS.MINISTRY_MANAGE)
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.get(user.sub, id);
  }

  @Post()
  @RequireAnyPermissions(PERMISSIONS.MINISTRY_MEETING_MANAGE, PERMISSIONS.MINISTRY_MANAGE)
  create(
    @CurrentUser() user: JwtPayload,
    @Param('ministryId') ministryId: string,
    @Body() dto: CreateMinistryMeetingDto,
  ) {
    return this.service.create(user.sub, { ...dto, ministryId });
  }

  @Patch(':id')
  @RequireAnyPermissions(PERMISSIONS.MINISTRY_MEETING_MANAGE, PERMISSIONS.MINISTRY_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMinistryMeetingDto,
  ) {
    return this.service.update(user.sub, id, dto);
  }

  @Post(':id/attendees')
  @RequireAnyPermissions(PERMISSIONS.MINISTRY_MEETING_MANAGE, PERMISSIONS.MINISTRY_MANAGE)
  attendee(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: RecordMeetingAttendeeDto,
  ) {
    return this.service.recordAttendee(user.sub, id, dto.memberId, dto.present);
  }

  @Post(':id/decisions')
  @RequireAnyPermissions(PERMISSIONS.MINISTRY_MEETING_MANAGE, PERMISSIONS.MINISTRY_MANAGE)
  decision(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { summary: string },
  ) {
    return this.service.addDecision(user.sub, id, body.summary);
  }

  @Post(':id/action-items')
  @RequireAnyPermissions(PERMISSIONS.MINISTRY_MEETING_MANAGE, PERMISSIONS.MINISTRY_MANAGE)
  actionItem(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateMeetingActionItemDto,
  ) {
    return this.service.addActionItem(user.sub, id, dto);
  }

  @Patch(':id/action-items/:itemId/complete')
  @RequireAnyPermissions(PERMISSIONS.MINISTRY_MEETING_MANAGE, PERMISSIONS.MINISTRY_MANAGE)
  completeActionItem(
    @CurrentUser() user: JwtPayload,
    @Param('id') _meetingId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.service.completeActionItem(user.sub, itemId);
  }
}
