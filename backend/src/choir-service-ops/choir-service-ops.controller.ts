import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ChurchServiceRequestStatus,
  ChoirServiceAssignmentRole,
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

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class ChoirServiceOpsController {
  constructor(
    private churchRequests: ChurchServiceRequestsService,
    private preparation: ServicePreparationService,
    private dissolution: ChoirDissolutionService,
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
