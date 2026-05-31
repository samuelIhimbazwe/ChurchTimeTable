import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { GovernanceService } from './governance.service';
import { ProtocolTeamGenerationService } from './protocol-team-generation.service';
import { AssignCommitteeMemberDto } from './dto/assign-committee-member.dto';
import { GenerateProtocolTeamsDto } from './dto/generate-protocol-teams.dto';
import { UpsertCommitteeRoleDto } from './dto/upsert-committee-role.dto';

@Controller('governance')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
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

  @Post('choir/members')
  @RequirePermissions(PERMISSIONS.COMMITTEE_MEMBER_MANAGE_SCOPE)
  assignChoirMember(
    @Body() dto: AssignCommitteeMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.governance.assignChoirCommitteeMember(dto, user.sub);
  }

  @Get('choir/:scopeId')
  @RequirePermissions(PERMISSIONS.EVENT_READ)
  listChoirCommittee(@Param('scopeId') scopeId: string) {
    return this.governance.listChoirCommittee(scopeId);
  }

  @Post('protocol/roles')
  @RequirePermissions(PERMISSIONS.COMMITTEE_ROLE_MANAGE_SCOPE)
  upsertProtocolRole(
    @Body() dto: UpsertCommitteeRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.governance.upsertProtocolCommitteeRole(dto, user.sub);
  }

  @Post('protocol/members')
  @RequirePermissions(PERMISSIONS.COMMITTEE_MEMBER_MANAGE_SCOPE)
  assignProtocolMember(
    @Body() dto: AssignCommitteeMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.governance.assignProtocolCommitteeMember(dto, user.sub);
  }

  @Get('protocol/:scopeId')
  @RequirePermissions(PERMISSIONS.EVENT_READ)
  listProtocolCommittee(@Param('scopeId') scopeId: string) {
    return this.governance.listProtocolCommittee(scopeId);
  }

  @Post('protocol/teams/generate')
  @RequirePermissions(PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE)
  generateProtocolTeams(
    @Body() dto: GenerateProtocolTeamsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.protocolTeamGeneration.generate(dto, user.sub);
  }
}
