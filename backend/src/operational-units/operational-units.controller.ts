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
import { OperationalUnitsService } from './operational-units.service';
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
import {
  AddOperationalUnitMemberDto,
  AssignOperationalUnitLeadershipDto,
  CreateOperationalUnitDto,
  EndOperationalUnitLeadershipDto,
  GrantOperationalUnitPermissionDto,
  UpdateOperationalUnitDto,
  UpdateOperationalUnitMemberDto,
  UpdateOperationalUnitSettingsDto,
} from './dto/operational-unit.dto';
import { IsOptional, IsString, IsUUID } from 'class-validator';

class OperationalUnitListQueryDto {
  @IsOptional()
  @IsUUID()
  ministryId?: string;
}

class OperationalUnitMemberQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}

@Controller('operational-units')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class OperationalUnitsController {
  constructor(private operationalUnitsService: OperationalUnitsService) {}

  @Get()
  @RequireAnyPermissions(
    PERMISSIONS.OPERATIONAL_UNIT_VIEW,
    PERMISSIONS.OPERATIONAL_UNIT_MANAGE,
    PERMISSIONS.OPERATIONAL_UNIT_MEMBER_VIEW,
    'operational_unit.member.view',
  )
  list(@CurrentUser() user: JwtPayload, @Query() query: OperationalUnitListQueryDto) {
    return this.operationalUnitsService.list(user.sub, query.ministryId);
  }

  @Get(':id/summary')
  @RequireAnyPermissions(
    PERMISSIONS.OPERATIONAL_UNIT_VIEW,
    PERMISSIONS.OPERATIONAL_UNIT_MANAGE,
    PERMISSIONS.OPERATIONAL_UNIT_REPORTS_VIEW,
  )
  summary(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.operationalUnitsService.getSummary(user.sub, id);
  }

  @Get(':id')
  @RequireAnyPermissions(
    PERMISSIONS.OPERATIONAL_UNIT_VIEW,
    PERMISSIONS.OPERATIONAL_UNIT_MANAGE,
  )
  getById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.operationalUnitsService.getById(user.sub, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.OPERATIONAL_UNIT_MANAGE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateOperationalUnitDto) {
    return this.operationalUnitsService.create(user.sub, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.OPERATIONAL_UNIT_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateOperationalUnitDto,
  ) {
    return this.operationalUnitsService.update(user.sub, id, dto);
  }

  @Get(':id/members')
  @RequireAnyPermissions(
    PERMISSIONS.OPERATIONAL_UNIT_MEMBER_VIEW,
    PERMISSIONS.OPERATIONAL_UNIT_MEMBER_MANAGE,
    PERMISSIONS.OPERATIONAL_UNIT_MANAGE,
  )
  listMembers(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query() query: OperationalUnitMemberQueryDto,
  ) {
    return this.operationalUnitsService.listMembers(user.sub, id, query.search);
  }

  @Post(':id/members')
  @RequireAnyPermissions(
    PERMISSIONS.OPERATIONAL_UNIT_MEMBER_MANAGE,
    PERMISSIONS.OPERATIONAL_UNIT_MANAGE,
  )
  addMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AddOperationalUnitMemberDto,
  ) {
    return this.operationalUnitsService.addMember(user.sub, id, dto);
  }

  @Patch(':id/members/:memberId')
  @RequireAnyPermissions(
    PERMISSIONS.OPERATIONAL_UNIT_MEMBER_MANAGE,
    PERMISSIONS.OPERATIONAL_UNIT_MANAGE,
  )
  updateMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateOperationalUnitMemberDto,
  ) {
    return this.operationalUnitsService.updateMember(user.sub, id, memberId, dto);
  }

  @Delete(':id/members/:memberId')
  @RequireAnyPermissions(
    PERMISSIONS.OPERATIONAL_UNIT_MEMBER_MANAGE,
    PERMISSIONS.OPERATIONAL_UNIT_MANAGE,
  )
  removeMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.operationalUnitsService.removeMember(user.sub, id, memberId);
  }

  @Get(':id/leadership')
  @RequireAnyPermissions(
    PERMISSIONS.OPERATIONAL_UNIT_LEADERSHIP_VIEW,
    PERMISSIONS.OPERATIONAL_UNIT_LEADERSHIP_MANAGE,
    PERMISSIONS.OPERATIONAL_UNIT_MANAGE,
  )
  listLeadership(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.operationalUnitsService.listLeadership(user.sub, id);
  }

  @Post(':id/leadership')
  @RequireAnyPermissions(
    PERMISSIONS.OPERATIONAL_UNIT_LEADERSHIP_MANAGE,
    PERMISSIONS.OPERATIONAL_UNIT_MANAGE,
  )
  assignLeadership(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AssignOperationalUnitLeadershipDto,
  ) {
    return this.operationalUnitsService.assignLeadership(user.sub, id, dto);
  }

  @Patch(':id/leadership/:assignmentId')
  @RequireAnyPermissions(
    PERMISSIONS.OPERATIONAL_UNIT_LEADERSHIP_MANAGE,
    PERMISSIONS.OPERATIONAL_UNIT_MANAGE,
  )
  endLeadership(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: EndOperationalUnitLeadershipDto,
  ) {
    return this.operationalUnitsService.endLeadership(
      user.sub,
      id,
      assignmentId,
      dto,
    );
  }

  @Get(':id/permissions')
  @RequireAnyPermissions(
    PERMISSIONS.OPERATIONAL_UNIT_MANAGE,
    PERMISSIONS.OPERATIONAL_UNIT_REPORTS_VIEW,
  )
  listPermissions(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.operationalUnitsService.listPermissions(user.sub, id);
  }

  @Post(':id/permissions')
  @RequirePermissions(PERMISSIONS.OPERATIONAL_UNIT_MANAGE)
  grantPermission(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: GrantOperationalUnitPermissionDto,
  ) {
    return this.operationalUnitsService.grantPermission(user.sub, id, dto);
  }

  @Delete(':id/permissions/:assignmentId')
  @RequirePermissions(PERMISSIONS.OPERATIONAL_UNIT_MANAGE)
  revokePermission(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.operationalUnitsService.revokePermission(user.sub, id, assignmentId);
  }

  @Get(':id/settings')
  @RequireAnyPermissions(
    PERMISSIONS.OPERATIONAL_UNIT_VIEW,
    PERMISSIONS.OPERATIONAL_UNIT_SETTINGS_MANAGE,
    PERMISSIONS.OPERATIONAL_UNIT_MANAGE,
  )
  getSettings(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.operationalUnitsService.getSettings(user.sub, id);
  }

  @Patch(':id/settings')
  @RequireAnyPermissions(
    PERMISSIONS.OPERATIONAL_UNIT_SETTINGS_MANAGE,
    PERMISSIONS.OPERATIONAL_UNIT_MANAGE,
  )
  updateSettings(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateOperationalUnitSettingsDto,
  ) {
    return this.operationalUnitsService.updateSettings(user.sub, id, dto);
  }

  @Get(':id/activity')
  @RequireAnyPermissions(
    PERMISSIONS.OPERATIONAL_UNIT_VIEW,
    PERMISSIONS.OPERATIONAL_UNIT_MANAGE,
  )
  listActivity(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.operationalUnitsService.listActivity(user.sub, id);
  }
}
