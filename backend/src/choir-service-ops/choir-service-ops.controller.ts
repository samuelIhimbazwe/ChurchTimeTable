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
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { ChurchServiceRequestsService } from './church-service-requests.service';
import { ServicePreparationService } from './service-preparation.service';
import { ChoirDissolutionService } from './choir-dissolution.service';
import { ChoirServiceAssignmentsService } from '../choir-scheduling/choir-service-assignments.service';
import {
  ChurchServiceOccurrenceService,
  type ChurchServiceSlotCode,
} from './church-service-occurrence.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class ChoirServiceOpsController {
  constructor(
    private churchRequests: ChurchServiceRequestsService,
    private preparation: ServicePreparationService,
    private dissolution: ChoirDissolutionService,
    private assignments: ChoirServiceAssignmentsService,
    private serviceOccurrences: ChurchServiceOccurrenceService,
  ) {}

  @Get('church/service-requests')
  @RequireUiCapability('church-service-requests-view')
  listChurchRequests(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: ChurchServiceRequestStatus,
    @Query('choirId') choirId?: string,
  ) {
    return this.churchRequests.list(userId, { status, choirId });
  }

  @Post('church/service-requests')
  @RequireUiCapability('church-service-request-create')
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
  @RequireUiCapability('church-service-assignments-view')
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
  @RequireUiCapability('church-service-assignments-view')
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
  @RequireUiCapability('church-service-request-schedule')
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
  @RequireUiCapability('church-service-request-schedule')
  confirmChurchAssignment(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { bypassRules?: boolean; overrideReason?: string },
  ) {
    return this.assignments.confirm(userId, id, body);
  }

  @Post('church/service-assignments/:id/reject')
  @RequireUiCapability('church-service-request-schedule')
  rejectChurchAssignment(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.assignments.reject(userId, id, body.reason);
  }

  @Post('church/service-requests/:id/review')
  @RequireUiCapability('church-service-request-schedule')
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
  @RequireUiCapability('ops-scheduling-hub')
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
  @RequireUiCapability('ops-scheduling-hub')
  getPreparation(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId: string,
    @Param('occurrenceId') occurrenceId: string,
  ) {
    return this.preparation.getPlan(userId, choirId, occurrenceId);
  }

  @Post('choir/service-preparation')
  @RequireUiCapability('ops-service-prep-manage')
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
  @RequireUiCapability('church-governance-manage')
  listDissolutions(@CurrentUser('sub') userId: string) {
    return this.dissolution.list(userId);
  }

  @Get('choirs/:choirId/dissolution-preview')
  @RequireUiCapability('church-governance-manage')
  previewDissolution(
    @CurrentUser('sub') userId: string,
    @Param('choirId') choirId: string,
  ) {
    return this.dissolution.preview(userId, choirId);
  }

  @Post('choirs/dissolution-transfer')
  @RequireUiCapability('church-governance-manage')
  executeDissolution(
    @CurrentUser('sub') userId: string,
    @Body() body: { sourceChoirId: string; targetChoirId: string; reason?: string },
  ) {
    return this.dissolution.execute(userId, body);
  }
}
