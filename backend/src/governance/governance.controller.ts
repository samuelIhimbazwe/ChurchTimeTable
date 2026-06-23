import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { GovernanceService } from './governance.service';
import { ProtocolTeamGenerationService } from './protocol-team-generation.service';
import { AssignCommitteeMemberDto } from './dto/assign-committee-member.dto';
import { GenerateProtocolTeamsDto } from './dto/generate-protocol-teams.dto';
import { UpsertCommitteeRoleDto } from './dto/upsert-committee-role.dto';
import { ChoirSodCheckDto } from './dto/choir-sod-check.dto';
import { ApplyChoirRoleTemplateDto } from './dto/apply-choir-role-template.dto';
import { CreateAdvisorElevationDto } from './dto/create-advisor-elevation.dto';

@Controller('governance')
@UseGuards(JwtAuthGuard, RolesGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class GovernanceController {
  constructor(
    private governance: GovernanceService,
    private protocolTeamGeneration: ProtocolTeamGenerationService,
  ) {}

  @Post('choir/roles')
  @RequireUiCapability('roles-committee-manage')
  upsertChoirRole(@Body() dto: UpsertCommitteeRoleDto, @CurrentUser() user: JwtPayload) {
    return this.governance.upsertChoirCommitteeRole(dto, user.sub);
  }

  @Post('choir/sod-check')
  @RequireUiCapability('roles-committee-manage')
  checkChoirSod(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChoirSodCheckDto,
    @Query('choirId') choirId?: string,
  ) {
    return this.governance.checkChoirPermissionSoD(
      user.sub,
      dto.permissions,
      dto.roleName,
      choirId,
    );
  }

  @Post('choir/members')
  @RequireUiCapability('roles-committee-member-manage')
  assignChoirMember(
    @Body() dto: AssignCommitteeMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.governance.assignChoirCommitteeMember(dto, user.sub);
  }

  @Delete('choir/members/:assignmentId')
  @RequireUiCapability('roles-committee-member-manage')
  revokeChoirMember(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body?: { effectiveEnd?: string },
  ) {
    return this.governance.revokeChoirCommitteeMember(
      assignmentId,
      user.sub,
      body?.effectiveEnd,
    );
  }

  @Get('choir/role-templates')
  @RequireUiCapability('roles-committee-manage')
  listChoirRoleTemplates(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId?: string,
  ) {
    return this.governance.listChoirRoleTemplates(user.sub, choirId);
  }

  @Post('choir/role-templates/:templateId/apply')
  @RequireUiCapability('roles-committee-manage')
  applyChoirRoleTemplate(
    @Param('templateId') templateId: string,
    @Body() dto: ApplyChoirRoleTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.governance.applyChoirRoleTemplate(templateId, dto, user.sub);
  }

  @Post('choir/advisor-elevations')
  @RequireUiCapability('roles-committee-manage')
  createAdvisorElevation(
    @Body() dto: CreateAdvisorElevationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.governance.createAdvisorElevation(dto, user.sub);
  }

  @Delete('choir/advisor-elevations/:elevationId')
  @RequireUiCapability('roles-committee-manage')
  revokeAdvisorElevation(
    @Param('elevationId') elevationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.governance.revokeAdvisorElevation(elevationId, user.sub);
  }

  @Get('choir/:scopeId/advisor-elevations')
  @RequireUiCapability('roles-committee-view')
  listAdvisorElevations(
    @Param('scopeId') scopeId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.governance.listAdvisorElevations(
      scopeId,
      activeOnly !== 'false',
    );
  }

  @Get('choir/:scopeId')
  @RequireUiCapability('roles-committee-view')
  listChoirCommittee(@Param('scopeId') scopeId: string) {
    return this.governance.listChoirCommittee(scopeId);
  }

  @Post('protocol/roles')
  @RequireUiCapability('protocol-committee-role-manage')
  upsertProtocolRole(
    @Body() dto: UpsertCommitteeRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.governance.upsertProtocolCommitteeRole(dto, user.sub);
  }

  @Post('protocol/members')
  @RequireUiCapability('protocol-committee-member-manage')
  assignProtocolMember(
    @Body() dto: AssignCommitteeMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.governance.assignProtocolCommitteeMember(dto, user.sub);
  }

  @Get('protocol/:scopeId')
  @RequireUiCapability('protocol-committee-member-manage')
  listProtocolCommittee(@Param('scopeId') scopeId: string) {
    return this.governance.listProtocolCommittee(scopeId);
  }

  @Delete('protocol/members/:assignmentId')
  @RequireUiCapability('protocol-committee-member-manage')
  revokeProtocolMember(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.governance.revokeProtocolCommitteeMember(assignmentId, user.sub);
  }

  @Post('protocol/teams/generate')
  @RequireUiCapability('protocol-team-manage')
  generateProtocolTeams(
    @Body() dto: GenerateProtocolTeamsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.protocolTeamGeneration.generate(dto, user.sub);
  }
}
