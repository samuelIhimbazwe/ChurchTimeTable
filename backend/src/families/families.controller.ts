import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FamiliesService } from './families.service';
import { FamilyMetricsService } from './family-metrics.service';
import {
  AddFamilyMemberDto,
  CreateFamilyDto,
  UpdateFamilyDto,
} from './dto/create-family.dto';
import { UpdateFamilyMemberDto } from './dto/update-family-member.dto';
import { UpdateFamilyPaymentDto } from './dto/update-family-payment.dto';
import { UpdateFamilyDelegationDto } from './dto/update-family-delegation.dto';
import { UpdateFamilyWorkspaceTemplateDto } from './dto/update-family-workspace-template.dto';
import { UpsertFamilyPulseDto } from './dto/upsert-family-pulse.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

class FamilyListQueryDto extends PaginationDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  includeMetrics?: boolean;

  @IsOptional()
  @IsString()
  familyId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

@Controller('families')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class FamiliesController {
  constructor(
    private familiesService: FamiliesService,
    private familyMetricsService: FamilyMetricsService,
  ) {}

  @Get('metrics/overview')
  @RequireAnyPermissions(
    PERMISSIONS.FAMILY_VIEW,
    PERMISSIONS.FAMILY_MANAGE,
    PERMISSIONS.CHOIR_FAMILY_VIEW,
    PERMISSIONS.CHOIR_FAMILY_MANAGE,
  )
  metricsOverview(@CurrentUser() user: JwtPayload) {
    return this.familyMetricsService.getOverview(user.sub);
  }

  @Get()
  @RequireAnyPermissions(
    PERMISSIONS.FAMILY_VIEW,
    PERMISSIONS.FAMILY_MANAGE,
    PERMISSIONS.CHOIR_FAMILY_VIEW,
    PERMISSIONS.CHOIR_FAMILY_MANAGE,
  )
  async list(@CurrentUser() user: JwtPayload, @Query() query: FamilyListQueryDto) {
    const result = await this.familiesService.list(
      user.sub,
      query.page,
      query.limit,
      query.includeMetrics,
      { familyId: query.familyId, search: query.search },
    );

    if (!query.includeMetrics) {
      return {
        items: result.items.map((row) =>
          this.familiesService.serializeListItem(row),
        ),
        meta: result.meta,
      };
    }

    const enrichmentByFamily = await this.familyMetricsService.enrichSummaries(
      user.sub,
      result.items.map((row) => ({
        id: row.id,
        familyCode: row.familyCode,
        familyName: row.familyName,
        memberIds: (row as { members?: { memberId: string }[] }).members?.map(
          (member) => member.memberId,
        ),
      })),
    );

    return {
      items: result.items.map((row) => {
        const enrichment = enrichmentByFamily.get(row.id);
        const contributions = enrichment?.contributions;
        return {
          ...this.familiesService.serializeListItem(
            row,
            enrichment?.health,
          ),
          ...(contributions
            ? {
                totalContributions: contributions.confirmedAmount,
                effectiveContributions: contributions.effectiveAmount,
                pendingContributions: contributions.pendingAmount,
              }
            : {}),
        };
      }),
      meta: result.meta,
    };
  }

  @Get(':id/metrics')
  @RequireAnyPermissions(
    PERMISSIONS.FAMILY_VIEW,
    PERMISSIONS.FAMILY_MANAGE,
    PERMISSIONS.CHOIR_FAMILY_VIEW,
    PERMISSIONS.CHOIR_FAMILY_MANAGE,
  )
  familyMetrics(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.familyMetricsService.getFamilyMetrics(user.sub, id);
  }

  @Get(':id/leadership-history')
  @RequireAnyPermissions(PERMISSIONS.FAMILY_VIEW, PERMISSIONS.FAMILY_MANAGE)
  leadershipHistory(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.familiesService.getLeadershipHistory(user.sub, id);
  }

  @Get(':id')
  @RequireAnyPermissions(
    PERMISSIONS.FAMILY_VIEW,
    PERMISSIONS.FAMILY_MANAGE,
    PERMISSIONS.CHOIR_FAMILY_VIEW,
    PERMISSIONS.CHOIR_FAMILY_MANAGE,
  )
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.familiesService.findOne(user.sub, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.FAMILY_MANAGE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateFamilyDto) {
    return this.familiesService.create(user.sub, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.FAMILY_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateFamilyDto,
  ) {
    return this.familiesService.update(user.sub, id, dto);
  }

  @Get(':id/payment-instructions/history')
  @RequireAnyPermissions(
    PERMISSIONS.FAMILY_VIEW,
    PERMISSIONS.FAMILY_MANAGE,
    PERMISSIONS.CHOIR_FAMILY_VIEW,
    PERMISSIONS.CHOIR_FAMILY_MANAGE,
  )
  paymentInstructionsHistory(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.familiesService.getPaymentInstructionsHistory(user.sub, id);
  }

  @Patch(':id/delegation')
  @RequireAnyPermissions(
    PERMISSIONS.FAMILY_VIEW,
    PERMISSIONS.FAMILY_MANAGE,
    PERMISSIONS.CHOIR_FAMILY_VIEW,
    PERMISSIONS.CHOIR_FAMILY_MANAGE,
  )
  updateDelegation(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateFamilyDelegationDto,
  ) {
    return this.familiesService.updateDelegation(
      user.sub,
      id,
      dto.delegationEnabled,
    );
  }

  @Patch(':id/workspace-template')
  @RequireAnyPermissions(
    PERMISSIONS.FAMILY_VIEW,
    PERMISSIONS.FAMILY_MANAGE,
    PERMISSIONS.CHOIR_FAMILY_VIEW,
    PERMISSIONS.CHOIR_FAMILY_MANAGE,
  )
  updateWorkspaceTemplate(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateFamilyWorkspaceTemplateDto,
  ) {
    return this.familiesService.updateWorkspaceTemplate(
      user.sub,
      id,
      dto.workspaceTemplate,
    );
  }

  @Get(':id/pulse')
  @RequireAnyPermissions(
    PERMISSIONS.FAMILY_VIEW,
    PERMISSIONS.FAMILY_MANAGE,
    PERMISSIONS.CHOIR_FAMILY_VIEW,
    PERMISSIONS.CHOIR_FAMILY_MANAGE,
  )
  getPulse(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('weekStart') weekStart?: string,
  ) {
    return this.familiesService.getPulse(user.sub, id, weekStart);
  }

  @Post(':id/pulse')
  @RequireAnyPermissions(
    PERMISSIONS.FAMILY_VIEW,
    PERMISSIONS.FAMILY_MANAGE,
    PERMISSIONS.CHOIR_FAMILY_VIEW,
    PERMISSIONS.CHOIR_FAMILY_MANAGE,
  )
  upsertPulse(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpsertFamilyPulseDto,
  ) {
    return this.familiesService.upsertPulse(user.sub, id, dto);
  }

  @Patch(':id/payment-instructions')
  @RequireAnyPermissions(
    PERMISSIONS.FAMILY_MANAGE,
    PERMISSIONS.CHOIR_FAMILY_MANAGE,
    PERMISSIONS.FAMILY_VIEW,
    PERMISSIONS.CHOIR_FAMILY_VIEW,
  )
  updatePaymentInstructions(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateFamilyPaymentDto,
  ) {
    return this.familiesService.updatePaymentInstructions(user.sub, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.FAMILY_MANAGE)
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.familiesService.remove(user.sub, id);
  }

  @Post(':id/members')
  @RequirePermissions(PERMISSIONS.FAMILY_MANAGE)
  addMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AddFamilyMemberDto,
  ) {
    return this.familiesService.addMember(user.sub, id, dto);
  }

  @Patch(':id/members/:memberId')
  @RequirePermissions(PERMISSIONS.FAMILY_MANAGE)
  updateMemberRole(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateFamilyMemberDto,
  ) {
    return this.familiesService.updateMemberRole(user.sub, id, memberId, dto);
  }

  @Delete(':id/members/:memberId')
  @RequirePermissions(PERMISSIONS.FAMILY_MANAGE)
  removeMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.familiesService.removeMember(user.sub, id, memberId);
  }
}
