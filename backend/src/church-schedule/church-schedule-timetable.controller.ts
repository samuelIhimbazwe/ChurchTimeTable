import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireAnyPermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { SkipPhoneEnforcement } from '../common/decorators/skip-phone-enforcement.decorator';
import { ChurchScheduleEntriesService } from './church-schedule-entries.service';
import { ChurchScheduleSubmissionsService } from './church-schedule-submissions.service';
import { CreateChurchScheduleEntryDto } from './dto/create-entry.dto';
import { ResolveChurchScheduleConflictDto } from './dto/resolve-conflict.dto';

@Controller('church/schedule')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class ChurchScheduleTimetableController {
  constructor(
    private entries: ChurchScheduleEntriesService,
    private submissions: ChurchScheduleSubmissionsService,
  ) {}

  @Get('conflicts')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(PERMISSIONS.CHURCH_SCHEDULE_VIEW_QUEUE)
  listConflicts(@CurrentUser('sub') userId: string) {
    return this.submissions.listConflicts(userId);
  }

  @Get('timetable')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(PERMISSIONS.CHURCH_SCHEDULE_VIEW)
  listTimetable(
    @CurrentUser('sub') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('facilityId') facilityId?: string,
    @Query('scopeType') scopeType?: string,
    @Query('scopeId') scopeId?: string,
  ) {
    return this.entries.listTimetable(userId, {
      from,
      to,
      facilityId,
      scopeType,
      scopeId,
    });
  }

  @Post('entries')
  @RequireAnyPermissions(PERMISSIONS.CHURCH_SCHEDULE_MANAGE)
  createEntry(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateChurchScheduleEntryDto,
  ) {
    return this.entries.createDirect(userId, dto);
  }

  @Post('entries/:id/cancel')
  @RequireAnyPermissions(PERMISSIONS.CHURCH_SCHEDULE_MANAGE)
  cancelEntry(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.entries.cancelEntry(userId, id, reason);
  }

  @Post('conflicts/:submissionId/resolve')
  @RequireAnyPermissions(PERMISSIONS.CHURCH_SCHEDULE_RESOLVE)
  resolveConflict(
    @CurrentUser('sub') userId: string,
    @Param('submissionId') submissionId: string,
    @Body() dto: ResolveChurchScheduleConflictDto,
  ) {
    return this.entries.resolveConflict(userId, submissionId, dto);
  }
}
