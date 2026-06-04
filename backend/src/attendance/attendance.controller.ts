import {

  Body,

  Controller,

  Get,

  Param,

  Patch,

  Post,

  Put,

  Query,

  UseGuards,

} from '@nestjs/common';

import { AttendanceService } from './attendance.service';

import { AttendanceGovernanceService } from './attendance-governance.service';

import { AttendanceEscalationService } from './attendance-escalation.service';

import { AttendanceScoringService } from './attendance-scoring.service';

import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';

import { BulkAttendanceDto } from './dto/bulk-attendance.dto';

import { EscalateAttendanceDto } from './dto/escalate-attendance.dto';

import { SubmitSelfExcuseDto } from './dto/submit-self-excuse.dto';

import { UpdateAttendanceWeightsDto } from './dto/update-attendance-weights.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';

import { RolesGuard } from '../common/guards/roles.guard';

import {
  RequireAnyPermissions,
  RequirePermissions,
} from '../common/decorators/roles.decorator';

import { ADMIN_SYNC_ACCESS, PERMISSIONS } from '../common/constants/roles';

import { CurrentUser } from '../common/decorators/current-user.decorator';

import type { JwtPayload } from '../common/decorators/current-user.decorator';

import { PaginationDto } from '../common/dto/pagination.dto';

import { OperationalScopeService } from '../governance/operational-scope.service';



@Controller('attendance')

@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)

export class AttendanceController {

  constructor(

    private attendanceService: AttendanceService,

    private governance: AttendanceGovernanceService,

    private escalation: AttendanceEscalationService,

    private scoring: AttendanceScoringService,

    private operationalScope: OperationalScopeService,

  ) {}



  @Post('bulk')

  @RequireAnyPermissions(

    PERMISSIONS.ATTENDANCE_WRITE,

    PERMISSIONS.PROTOCOL_ATTENDANCE_MANAGE,

    PERMISSIONS.CHOIR_ATTENDANCE_MANAGE,

    PERMISSIONS.ATTENDANCE_MARK_SCOPE,

  )

  bulkUpsert(@Body() dto: BulkAttendanceDto, @CurrentUser() user: JwtPayload) {

    return this.attendanceService.bulkUpsert(dto.records, user.sub);

  }



  @Patch(':id/excused-review')

  @RequireAnyPermissions(

    PERMISSIONS.ATTENDANCE_WRITE,

    PERMISSIONS.PROTOCOL_ATTENDANCE_MANAGE,

    PERMISSIONS.CHOIR_ATTENDANCE_MANAGE,

  )

  reviewExcused(

    @Param('id') id: string,

    @Body('approve') approve: boolean,

    @CurrentUser() user: JwtPayload,

  ) {

    return this.attendanceService.approveExcused(id, approve, user.sub);

  }



  @Post(':id/escalate')

  @RequireAnyPermissions(

    PERMISSIONS.ATTENDANCE_WRITE,

    PERMISSIONS.PROTOCOL_ATTENDANCE_MANAGE,

    PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,

  )

  escalate(

    @Param('id') id: string,

    @Body() dto: EscalateAttendanceDto,

    @CurrentUser() user: JwtPayload,

  ) {

    return this.escalation.escalate(id, dto.level, user.sub, dto.notes);

  }



  @Put()

  @RequireAnyPermissions(

    PERMISSIONS.ATTENDANCE_WRITE,

    PERMISSIONS.PROTOCOL_ATTENDANCE_MANAGE,

    PERMISSIONS.CHOIR_ATTENDANCE_MANAGE,

    PERMISSIONS.ATTENDANCE_MARK_SCOPE,

  )

  upsert(@Body() dto: UpsertAttendanceDto, @CurrentUser() user: JwtPayload) {

    return this.attendanceService.upsert(dto, user.sub);

  }



  @Post('self/excused')

  @RequirePermissions(PERMISSIONS.EVENT_READ)

  submitSelfExcuse(

    @Body() dto: SubmitSelfExcuseDto,

    @CurrentUser() user: JwtPayload,

  ) {

    return this.attendanceService.submitSelfExcuse(dto, user.sub, user.memberId);

  }



  @Get('scoring/weights')

  @RequireAnyPermissions(...ADMIN_SYNC_ACCESS)

  getScoringWeights() {

    return this.scoring.getWeights();

  }



  @Patch('scoring/weights')

  @RequireAnyPermissions(...ADMIN_SYNC_ACCESS)

  updateScoringWeights(@Body() dto: UpdateAttendanceWeightsDto) {

    return this.scoring.updateWeights(dto.weights ?? {});

  }



  @Get('discipline-recommendations')

  @RequireAnyPermissions(

    PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,

    PERMISSIONS.DISCIPLINE_MANAGE,

    PERMISSIONS.DISCIPLINE_REVIEW_SCOPE,

  )

  async disciplineRecommendations(@CurrentUser() user: JwtPayload) {

    const ctx = await this.operationalScope.buildForUser(user.sub);

    return this.governance.disciplineRecommendations(ctx.scopedMemberIds);

  }



  @Get('analytics')

  @RequireAnyPermissions(

    PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,

    PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,

    PERMISSIONS.CHOIR_OVERSIGHT,

  )

  analytics() {

    return this.governance.analyticsOverview();

  }



  @Get('operational/team-head')

  @RequireAnyPermissions(

    PERMISSIONS.PROTOCOL_TEAM_HEAD,

    PERMISSIONS.ATTENDANCE_MARK_SCOPE,

    PERMISSIONS.PROTOCOL_ATTENDANCE_MANAGE,

  )

  teamHeadSummary(@CurrentUser() user: JwtPayload) {

    return this.governance.teamHeadSummary(user.sub);

  }



  @Get('operational/coordinator')

  @RequireAnyPermissions(

    PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,

    PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,

  )

  async coordinatorSummary(@CurrentUser() user: JwtPayload) {

    const ctx = await this.operationalScope.buildForUser(user.sub);

    return this.governance.coordinatorSummary(ctx);

  }



  @Get('operational/president')

  @RequireAnyPermissions(PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE)

  async presidentSummary(@CurrentUser() user: JwtPayload) {

    const ctx = await this.operationalScope.buildForUser(user.sub);

    return this.governance.presidentSummary(ctx);

  }



  @Get('operational/choir')

  @RequireAnyPermissions(

    PERMISSIONS.CHOIR_ATTENDANCE_MANAGE,

    PERMISSIONS.CHOIR_OPERATIONS_MANAGE,

    PERMISSIONS.CHOIR_EVENTS_MANAGE_SCOPE,

    PERMISSIONS.ATTENDANCE_WRITE,

  )

  choirSummary() {

    return this.governance.choirAttendanceSummary();

  }



  @Get('member/:memberId/score')

  @RequirePermissions(PERMISSIONS.EVENT_READ)

  memberScore(@Param('memberId') memberId: string) {

    return this.attendanceService.memberScore(memberId);

  }



  @Get('member/:memberId/history')

  @RequirePermissions(PERMISSIONS.EVENT_READ)

  memberHistory(@Param('memberId') memberId: string) {

    return this.governance.memberHistory(memberId);

  }



  @Get('event/:eventId')

  @RequirePermissions(PERMISSIONS.EVENT_READ)

  byEvent(@Param('eventId') eventId: string, @Query() query: PaginationDto) {

    return this.attendanceService.findByEvent(eventId, query.page, query.limit);

  }



  @Get('member/:memberId')

  @RequirePermissions(PERMISSIONS.EVENT_READ)

  byMember(@Param('memberId') memberId: string, @Query() query: PaginationDto) {

    return this.attendanceService.findByMember(memberId, query.page, query.limit);

  }

}


