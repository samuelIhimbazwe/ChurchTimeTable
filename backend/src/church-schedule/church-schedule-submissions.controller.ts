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
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { SkipPhoneEnforcement } from '../common/decorators/skip-phone-enforcement.decorator';
import { ChurchScheduleSubmissionsService } from './church-schedule-submissions.service';
import { CreateChurchScheduleSubmissionDto } from './dto/create-submission.dto';
import { UpdateChurchScheduleSubmissionDto } from './dto/update-submission.dto';

@Controller('church/schedule/submissions')
@UseGuards(JwtAuthGuard, RolesGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class ChurchScheduleSubmissionsController {
  constructor(private submissions: ChurchScheduleSubmissionsService) {}

  @Get('scopes')
  @SkipPhoneEnforcement()
  @RequireUiCapability('church-schedule-view')
  listScopes(@CurrentUser('sub') userId: string) {
    return this.submissions.listScopes(userId);
  }

  @Get('mine')
  @SkipPhoneEnforcement()
  @RequireUiCapability('church-schedule-view')
  listMine(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: ChurchScheduleSubmissionStatus,
  ) {
    return this.submissions.listMine(userId, status);
  }

  @Get('conflicts')
  @SkipPhoneEnforcement()
  @RequireUiCapability('church-schedule-view-queue')
  listConflicts(@CurrentUser('sub') userId: string) {
    return this.submissions.listConflicts(userId);
  }

  @Get(':id')
  @SkipPhoneEnforcement()
  @RequireUiCapability('church-schedule-view')
  getOne(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.submissions.getOne(userId, id);
  }

  @Post()
  @RequireUiCapability('church-schedule-submit')
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateChurchScheduleSubmissionDto,
  ) {
    return this.submissions.create(userId, dto);
  }

  @Patch(':id')
  @RequireUiCapability('church-schedule-submit')
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateChurchScheduleSubmissionDto,
  ) {
    return this.submissions.update(userId, id, dto);
  }

  @Post(':id/submit')
  @RequireUiCapability('church-schedule-submit')
  submit(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.submissions.submit(userId, id);
  }

  @Post(':id/accept-counter')
  @RequireUiCapability('church-schedule-submit')
  acceptCounter(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.submissions.acceptCounterProposal(userId, id);
  }

  @Post(':id/cancel')
  @RequireUiCapability('church-schedule-view')
  cancel(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.submissions.cancel(userId, id);
  }
}
