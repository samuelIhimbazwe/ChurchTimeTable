import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from '../common/decorators/roles.decorator';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { PERMISSIONS } from '../common/constants/roles';
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
  @RequirePermissions(PERMISSIONS.COMMITTEE_ROLE_MANAGE_SCOPE)
  upsertChoirRole(@Body() dto: UpsertCommitteeRoleDto, @CurrentUser() user: JwtPayload) {
    return this.governance.upsertChoirCommitteeRole(dto, user.sub);
  }

  @Post('choir/sod-check')
  @RequirePermissions(PERMISSIONS.COMMITTEE_ROLE_MANAGE_SCOPE)
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
  @RequirePermissions(PERMISSIONS.COMMITTEE_MEMBER_MANAGE_SCOPE)
  assignChoirMember(
    @Body() dto: AssignCommitteeMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.governance.assignChoirCommitteeMember(dto, user.sub);
  }

  @Delete('choir/members/:assignmentId')
  @RequirePermissions(PERMISSIONS.COMMITTEE_MEMBER_MANAGE_SCOPE)
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
  @RequirePermissions(PERMISSIONS.COMMITTEE_ROLE_MANAGE_SCOPE)
  listChoirRoleTemplates(
    @CurrentUser() user: JwtPayload,
    @Query('choirId') choirId?: string,
  ) {
    return this.governance.listChoirRoleTemplates(user.sub, choirId);
  }

  @Post('choir/role-templates/:templateId/apply')
  @RequirePermissions(PERMISSIONS.COMMITTEE_ROLE_MANAGE_SCOPE)
  applyChoirRoleTemplate(
    @Param('templateId') templateId: string,
    @Body() dto: ApplyChoirRoleTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.governance.applyChoirRoleTemplate(templateId, dto, user.sub);
  }

  @Post('choir/advisor-elevations')
  @RequirePermissions(PERMISSIONS.COMMITTEE_ROLE_MANAGE_SCOPE)
  createAdvisorElevation(
    @Body() dto: CreateAdvisorElevationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.governance.createAdvisorElevation(dto, user.sub);
  }

  @Delete('choir/advisor-elevations/:elevationId')
  @RequirePermissions(PERMISSIONS.COMMITTEE_ROLE_MANAGE_SCOPE)
  revokeAdvisorElevation(
    @Param('elevationId') elevationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.governance.revokeAdvisorElevation(elevationId, user.sub);
  }

  @Get('choir/:scopeId/advisor-elevations')
  @RequirePermissions(PERMISSIONS.EVENT_READ)
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
  @RequirePermissions(PERMISSIONS.EVENT_READ)
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
