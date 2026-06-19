import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ChurchServiceRequestStatus,
  ChoirServiceAssignmentRole,
  ChoirServiceAssignmentStatus,
  PepTalkTiming,
  ServicePreparationItemType,
} from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireAnyPermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { ChurchServiceRequestsService } from './church-service-requests.service';
import { ServicePreparationService } from './service-preparation.service';
import { ChoirDissolutionService } from './choir-dissolution.service';
import { ChoirServiceAssignmentsService } from '../choir-scheduling/choir-service-assignments.service';
import {
  ChurchServiceOccurrenceService,
  type ChurchServiceSlotCode,
} from './church-service-occurrence.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class ChoirServiceOpsController {
  constructor(
    private churchRequests: ChurchServiceRequestsService,
    private preparation: ServicePreparationService,
    private dissolution: ChoirDissolutionService,
    private assignments: ChoirServiceAssignmentsService,
    private serviceOccurrences: ChurchServiceOccurrenceService,
  ) {}

  @Get('church/service-requests')
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_GOVERNANCE_MANAGE,
    PERMISSIONS.CHURCH_GOVERNANCE_VIEW,
    PERMISSIONS.OPERATIONS_MANAGE,
    PERMISSIONS.CHOIR_OVERSIGHT,
    PERMISSIONS.CHOIR_OPS_SCHEDULE,
  )
  listChurchRequests(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: ChurchServiceRequestStatus,
    @Query('choirId') choirId?: string,
  ) {
    return this.churchRequests.list(userId, { status, choirId });
  }

  @Post('church/service-requests')
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_GOVERNANCE_MANAGE,
    PERMISSIONS.OPERATIONS_MANAGE,
  )
  createChurchRequest(
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      occurrenceId: string;
      preferredChoirId?: string;
      role?: ChoirServiceAssignmentRole;
      title?: string;
      notes?: string;
    },
  ) {
    return this.churchRequests.create(userId, body);
  }

  @Get('church/service-assignments/conflicts')
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_SCHEDULE_MANAGE,
    PERMISSIONS.CHURCH_SCHEDULE_RESOLVE,
    PERMISSIONS.CHURCH_GOVERNANCE_MANAGE,
  )
  checkAssignmentConflicts(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId: string,
    @Query('occurrenceId') occurrenceId?: string,
    @Query('serviceDate') serviceDate?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    if (occurrenceId) {
      return this.assignments.checkConflicts(userId, choirId, occurrenceId);
    }
    if (!serviceDate || !startTime || !endTime) {
      return { hasConflict: false, conflicts: [], summary: null };
    }
    const startAt = new Date(`${serviceDate}T${startTime}:00`);
    const endAt = new Date(`${serviceDate}T${endTime}:00`);
    return this.assignments.checkConflictsForSlot(userId, choirId, startAt, endAt);
  }

  @Get('church/service-assignments')
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_SCHEDULE_VIEW_QUEUE,
    PERMISSIONS.CHURCH_SCHEDULE_MANAGE,
    PERMISSIONS.CHURCH_SCHEDULE_RESOLVE,
    PERMISSIONS.CHURCH_GOVERNANCE_MANAGE,
  )
  listChurchAssignments(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: ChoirServiceAssignmentStatus,
    @Query('pendingOnly') pendingOnly?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (pendingOnly === 'true') {
      return this.assignments.listPendingForChurch(userId);
    }
    return this.assignments.listForChurch(userId, {
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Post('church/service-assignments')
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_SCHEDULE_MANAGE,
    PERMISSIONS.CHURCH_SCHEDULE_RESOLVE,
    PERMISSIONS.CHURCH_GOVERNANCE_MANAGE,
  )
  async churchDirectAssign(
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      choirId: string;
      occurrenceId?: string;
      serviceCode?: ChurchServiceSlotCode;
      customServiceName?: string;
      serviceDate?: string;
      startTime?: string;
      endTime?: string;
      role?: ChoirServiceAssignmentRole;
      overrideReason?: string;
      bypassRules?: boolean;
    },
  ) {
    let occurrenceId = body.occurrenceId;
    if (!occurrenceId) {
      if (
        !body.serviceCode ||
        !body.serviceDate ||
        !body.startTime ||
        !body.endTime
      ) {
        throw new BadRequestException('Service, date, and times are required');
      }
      const occurrence = await this.serviceOccurrences.resolveOrCreate(userId, {
        serviceCode: body.serviceCode,
        customServiceName: body.customServiceName,
        serviceDate: body.serviceDate,
        startTime: body.startTime,
        endTime: body.endTime,
      });
      occurrenceId = occurrence.id;
    }
    return this.assignments.churchDirectAssign(userId, {
      choirId: body.choirId,
      occurrenceId,
      role: body.role,
      overrideReason: body.overrideReason,
      bypassRules: body.bypassRules,
    });
  }

  @Post('church/service-assignments/:id/confirm')
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_SCHEDULE_RESOLVE,
    PERMISSIONS.CHURCH_SCHEDULE_MANAGE,
    PERMISSIONS.CHURCH_GOVERNANCE_MANAGE,
  )
  confirmChurchAssignment(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { bypassRules?: boolean; overrideReason?: string },
  ) {
    return this.assignments.confirm(userId, id, body);
  }

  @Post('church/service-assignments/:id/reject')
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_SCHEDULE_RESOLVE,
    PERMISSIONS.CHURCH_SCHEDULE_MANAGE,
    PERMISSIONS.CHURCH_GOVERNANCE_MANAGE,
  )
  rejectChurchAssignment(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.assignments.reject(userId, id, body.reason);
  }

  @Post('church/service-requests/:id/review')
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_OPS_SCHEDULE,
    PERMISSIONS.CHOIR_OPS_MANAGE,
    PERMISSIONS.CHURCH_GOVERNANCE_MANAGE,
  )
  reviewChurchRequest(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body()
    body: {
      status: 'APPROVED' | 'REJECTED';
      assignedChoirId?: string;
      reviewNotes?: string;
    },
  ) {
    return this.churchRequests.review(userId, id, body);
  }

  @Get('choir/member-service-preparation')
  listMemberPreparation(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.preparation.listForMember(
      userId,
      choirId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('choir/member-service-preparation/:occurrenceId')
  getMemberPreparation(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId: string,
    @Param('occurrenceId') occurrenceId: string,
  ) {
    return this.preparation.getPlanForMember(userId, choirId, occurrenceId);
  }

  @Get('choir/service-preparation')
  @RequireAnyPermissions(PERMISSIONS.CHOIR_OPS_VIEW, PERMISSIONS.CHOIR_REHEARSAL_VIEW)
  listPreparation(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.preparation.listForChoir(
      userId,
      choirId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('choir/service-preparation/:occurrenceId')
  @RequireAnyPermissions(PERMISSIONS.CHOIR_OPS_VIEW, PERMISSIONS.CHOIR_REHEARSAL_VIEW)
  getPreparation(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId: string,
    @Param('occurrenceId') occurrenceId: string,
  ) {
    return this.preparation.getPlan(userId, choirId, occurrenceId);
  }

  @Post('choir/service-preparation')
  @RequireAnyPermissions(PERMISSIONS.CHOIR_OPS_MANAGE, PERMISSIONS.CHOIR_OPERATIONS_MANAGE)
  upsertPreparation(
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      choirId: string;
      occurrenceId: string;
      uniformNotes?: string;
      pepTalkTitle?: string;
      pepTalkAt?: string;
      pepTalkTiming?: PepTalkTiming;
      items?: Array<{
        itemType: ServicePreparationItemType;
        title: string;
        body?: string;
        songId?: string;
        scheduledAt?: string;
        sortOrder?: number;
      }>;
    },
  ) {
    return this.preparation.upsertPlan(userId, body);
  }

  @Post('choir/member-service-preparation/:occurrenceId/acknowledge')
  acknowledgeMemberPreparation(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId: string,
    @Param('occurrenceId') occurrenceId: string,
    @Body() body: { itemKey: string },
  ) {
    return this.preparation.acknowledgeForMember(
      userId,
      choirId,
      occurrenceId,
      body.itemKey,
    );
  }

  @Get('choirs/dissolution-transfers')
  @RequireAnyPermissions(PERMISSIONS.CHURCH_GOVERNANCE_MANAGE, PERMISSIONS.CHOIR_OVERSIGHT)
  listDissolutions(@CurrentUser('sub') userId: string) {
    return this.dissolution.list(userId);
  }

  @Get('choirs/:choirId/dissolution-preview')
  @RequireAnyPermissions(PERMISSIONS.CHURCH_GOVERNANCE_MANAGE, PERMISSIONS.CHOIR_OVERSIGHT)
  previewDissolution(
    @CurrentUser('sub') userId: string,
    @Param('choirId') choirId: string,
  ) {
    return this.dissolution.preview(userId, choirId);
  }

  @Post('choirs/dissolution-transfer')
  @RequireAnyPermissions(PERMISSIONS.CHURCH_GOVERNANCE_MANAGE)
  executeDissolution(
    @CurrentUser('sub') userId: string,
    @Body() body: { sourceChoirId: string; targetChoirId: string; reason?: string },
  ) {
    return this.dissolution.execute(userId, body);
  }
}
