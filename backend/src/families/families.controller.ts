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
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
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
@UseGuards(JwtAuthGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class FamiliesController {
  constructor(
    private familiesService: FamiliesService,
    private familyMetricsService: FamilyMetricsService,
  ) {}

  @Get('metrics/overview')
  @RequireUiCapability('family-hub')
  metricsOverview(@CurrentUser() user: JwtPayload) {
    return this.familyMetricsService.getOverview(user.sub);
  }

  @Get()
  @RequireUiCapability('family-hub')
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
  @RequireUiCapability('family-hub')
  familyMetrics(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.familyMetricsService.getFamilyMetrics(user.sub, id);
  }

  @Get(':id/leadership-history')
  @RequireUiCapability('family-hub')
  leadershipHistory(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.familiesService.getLeadershipHistory(user.sub, id);
  }

  @Get(':id')
  @RequireUiCapability('family-hub')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.familiesService.findOne(user.sub, id);
  }

  @Post()
  @RequireUiCapability('family-manage')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateFamilyDto) {
    return this.familiesService.create(user.sub, dto);
  }

  @Patch(':id')
  @RequireUiCapability('family-manage')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateFamilyDto,
  ) {
    return this.familiesService.update(user.sub, id, dto);
  }

  @Get(':id/payment-instructions/history')
  @RequireUiCapability('family-hub')
  paymentInstructionsHistory(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.familiesService.getPaymentInstructionsHistory(user.sub, id);
  }

  @Patch(':id/delegation')
  @RequireUiCapability('family-hub')
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
  @RequireUiCapability('family-hub')
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
  @RequireUiCapability('family-hub')
  getPulse(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('weekStart') weekStart?: string,
  ) {
    return this.familiesService.getPulse(user.sub, id, weekStart);
  }

  @Post(':id/pulse')
  @RequireUiCapability('family-hub')
  upsertPulse(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpsertFamilyPulseDto,
  ) {
    return this.familiesService.upsertPulse(user.sub, id, dto);
  }

  @Patch(':id/payment-instructions')
  @RequireUiCapability('family-hub')
  updatePaymentInstructions(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateFamilyPaymentDto,
  ) {
    return this.familiesService.updatePaymentInstructions(user.sub, id, dto);
  }

  @Delete(':id')
  @RequireUiCapability('family-manage')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.familiesService.remove(user.sub, id);
  }

  @Post(':id/members')
  @RequireUiCapability('family-manage')
  addMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AddFamilyMemberDto,
  ) {
    return this.familiesService.addMember(user.sub, id, dto);
  }

  @Patch(':id/members/:memberId')
  @RequireUiCapability('family-manage')
  updateMemberRole(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateFamilyMemberDto,
  ) {
    return this.familiesService.updateMemberRole(user.sub, id, memberId, dto);
  }

  @Delete(':id/members/:memberId')
  @RequireUiCapability('family-manage')
  removeMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.familiesService.removeMember(user.sub, id, memberId);
  }
}
