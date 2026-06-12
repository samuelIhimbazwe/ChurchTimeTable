import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChurchScheduleSubmissionStatus } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireAnyPermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { SkipPhoneEnforcement } from '../common/decorators/skip-phone-enforcement.decorator';
import { ChurchScheduleSubmissionsService } from './church-schedule-submissions.service';
import { CreateChurchScheduleSubmissionDto } from './dto/create-submission.dto';
import { UpdateChurchScheduleSubmissionDto } from './dto/update-submission.dto';

@Controller('church/schedule/submissions')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class ChurchScheduleSubmissionsController {
  constructor(private submissions: ChurchScheduleSubmissionsService) {}

  @Get('scopes')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_SCHEDULE_SUBMIT,
    PERMISSIONS.CHURCH_SCHEDULE_VIEW,
    PERMISSIONS.CHURCH_SCHEDULE_MANAGE,
  )
  listScopes(@CurrentUser('sub') userId: string) {
    return this.submissions.listScopes(userId);
  }

  @Get('mine')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_SCHEDULE_SUBMIT,
    PERMISSIONS.CHURCH_SCHEDULE_VIEW,
  )
  listMine(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: ChurchScheduleSubmissionStatus,
  ) {
    return this.submissions.listMine(userId, status);
  }

  @Get('conflicts')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(PERMISSIONS.CHURCH_SCHEDULE_VIEW_QUEUE)
  listConflicts(@CurrentUser('sub') userId: string) {
    return this.submissions.listConflicts(userId);
  }

  @Get(':id')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_SCHEDULE_SUBMIT,
    PERMISSIONS.CHURCH_SCHEDULE_VIEW,
    PERMISSIONS.CHURCH_SCHEDULE_VIEW_QUEUE,
  )
  getOne(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.submissions.getOne(userId, id);
  }

  @Post()
  @RequireAnyPermissions(PERMISSIONS.CHURCH_SCHEDULE_SUBMIT)
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateChurchScheduleSubmissionDto,
  ) {
    return this.submissions.create(userId, dto);
  }

  @Patch(':id')
  @RequireAnyPermissions(PERMISSIONS.CHURCH_SCHEDULE_SUBMIT)
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateChurchScheduleSubmissionDto,
  ) {
    return this.submissions.update(userId, id, dto);
  }

  @Post(':id/submit')
  @RequireAnyPermissions(PERMISSIONS.CHURCH_SCHEDULE_SUBMIT)
  submit(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.submissions.submit(userId, id);
  }

  @Post(':id/accept-counter')
  @RequireAnyPermissions(PERMISSIONS.CHURCH_SCHEDULE_SUBMIT)
  acceptCounter(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.submissions.acceptCounterProposal(userId, id);
  }

  @Post(':id/cancel')
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_SCHEDULE_SUBMIT,
    PERMISSIONS.CHURCH_SCHEDULE_MANAGE,
  )
  cancel(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.submissions.cancel(userId, id);
  }
}
