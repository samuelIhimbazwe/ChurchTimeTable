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
import { MinistriesService } from './ministries.service';
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
  AddMinistryMemberDto,
  AssignMinistryLeadershipDto,
  CreateMinistryDto,
  EndMinistryLeadershipDto,
  GrantMinistryPermissionDto,
  UpdateMinistryDto,
  UpdateMinistryMemberDto,
  UpdateMinistrySettingsDto,
} from './dto/ministry.dto';
import { IsOptional, IsString } from 'class-validator';

class MinistryMemberQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}

@Controller('ministries')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class MinistriesController {
  constructor(private ministriesService: MinistriesService) {}

  @Get()
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_VIEW,
    PERMISSIONS.MINISTRY_MANAGE,
    PERMISSIONS.MINISTRY_MEMBER_VIEW,
    PERMISSIONS.MINISTRY_MEMBER_MANAGE,
    PERMISSIONS.MINISTRY_LEADERSHIP_VIEW,
    PERMISSIONS.MINISTRY_REPORTS_VIEW,
    'ministry.member.view',
    'ministry.member.manage',
  )
  list(@CurrentUser() user: JwtPayload) {
    return this.ministriesService.list(user.sub);
  }

  @Get(':id/summary')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_VIEW,
    PERMISSIONS.MINISTRY_MANAGE,
    PERMISSIONS.MINISTRY_REPORTS_VIEW,
  )
  summary(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ministriesService.getSummary(user.sub, id);
  }

  @Get(':id')
  @RequireAnyPermissions(PERMISSIONS.MINISTRY_VIEW, PERMISSIONS.MINISTRY_MANAGE)
  getById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ministriesService.getById(user.sub, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MINISTRY_CREATE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateMinistryDto) {
    return this.ministriesService.create(user.sub, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MINISTRY_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMinistryDto,
  ) {
    return this.ministriesService.update(user.sub, id, dto);
  }

  @Get(':id/members')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_MEMBER_VIEW,
    PERMISSIONS.MINISTRY_MEMBER_MANAGE,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  listMembers(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query() query: MinistryMemberQueryDto,
  ) {
    return this.ministriesService.listMembers(user.sub, id, query.search);
  }

  @Post(':id/members')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_MEMBER_MANAGE,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  addMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AddMinistryMemberDto,
  ) {
    return this.ministriesService.addMember(user.sub, id, dto);
  }

  @Patch(':id/members/:memberId')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_MEMBER_MANAGE,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  updateMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMinistryMemberDto,
  ) {
    return this.ministriesService.updateMember(user.sub, id, memberId, dto);
  }

  @Delete(':id/members/:memberId')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_MEMBER_MANAGE,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  removeMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.ministriesService.removeMember(user.sub, id, memberId);
  }

  @Get(':id/leadership')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_LEADERSHIP_VIEW,
    PERMISSIONS.MINISTRY_LEADERSHIP_MANAGE,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  listLeadership(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ministriesService.listLeadership(user.sub, id);
  }

  @Post(':id/leadership')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_LEADERSHIP_MANAGE,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  assignLeadership(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AssignMinistryLeadershipDto,
  ) {
    return this.ministriesService.assignLeadership(user.sub, id, dto);
  }

  @Patch(':id/leadership/:assignmentId')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_LEADERSHIP_MANAGE,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  endLeadership(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: EndMinistryLeadershipDto,
  ) {
    return this.ministriesService.endLeadership(user.sub, id, assignmentId, dto);
  }

  @Get(':id/permissions')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_MANAGE,
    PERMISSIONS.MINISTRY_REPORTS_VIEW,
  )
  listPermissions(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ministriesService.listPermissions(user.sub, id);
  }

  @Post(':id/permissions')
  @RequirePermissions(PERMISSIONS.MINISTRY_MANAGE)
  grantPermission(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: GrantMinistryPermissionDto,
  ) {
    return this.ministriesService.grantPermission(user.sub, id, dto);
  }

  @Delete(':id/permissions/:assignmentId')
  @RequirePermissions(PERMISSIONS.MINISTRY_MANAGE)
  revokePermission(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.ministriesService.revokePermission(user.sub, id, assignmentId);
  }

  @Get(':id/settings')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_SETTINGS_VIEW,
    PERMISSIONS.MINISTRY_SETTINGS_MANAGE,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  getSettings(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ministriesService.getSettings(user.sub, id);
  }

  @Patch(':id/settings')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_SETTINGS_MANAGE,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  updateSettings(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMinistrySettingsDto,
  ) {
    return this.ministriesService.updateSettings(user.sub, id, dto);
  }

}
