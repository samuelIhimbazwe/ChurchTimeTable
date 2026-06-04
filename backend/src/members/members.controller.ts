import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MemberStatus, MinistryScope } from '@prisma/client';
import { MembersService } from './members.service';
import { MemberProfileService } from './member-profile.service';
import { MemberTimelineService } from './member-timeline.service';
import { UpdateMemberStatusDto } from './dto/update-member-status.dto';
import { UpdateMemberProfileDto } from './dto/update-member-profile.dto';
import { SkipPhoneEnforcement } from '../common/decorators/skip-phone-enforcement.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { MEMBER_ROSTER_ACCESS_CLAIMS } from '../common/governance/governance-permissions.util';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class MembersController {
  constructor(
    private membersService: MembersService,
    private memberProfile: MemberProfileService,
    private memberTimeline: MemberTimelineService,
  ) {}

  @Get('roster')
  @RequireAnyPermissions(...MEMBER_ROSTER_ACCESS_CLAIMS)
  findRoster(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationDto & {
      status?: MemberStatus;
      ministry?: MinistryScope;
    },
  ) {
    return this.membersService.findRoster(user.sub, query.page, query.limit, {
      status: query.status,
      ministry: query.ministry,
    });
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MEMBER_MANAGE)
  findAll(
    @Query() query: PaginationDto & {
      status?: MemberStatus;
      ministry?: MinistryScope;
    },
  ) {
    return this.membersService.findAll(query.page, query.limit, {
      status: query.status,
      ministry: query.ministry,
    });
  }

  @Get(':id/profile')
  @SkipPhoneEnforcement()
  profileCenter(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.memberProfile.getProfileCenter(user.sub, id);
  }

  @Get(':id/status-history')
  @SkipPhoneEnforcement()
  statusHistory(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.memberProfile.getStatusHistory(
      user.sub,
      id,
      limit ? Number(limit) : 50,
    );
  }

  @Get(':id/attendance')
  @SkipPhoneEnforcement()
  memberAttendance(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.memberProfile.getAttendance(user.sub, id);
  }

  @Get(':id/contributions')
  @SkipPhoneEnforcement()
  memberContributions(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query() query: PaginationDto,
  ) {
    return this.memberProfile.getContributions(
      user.sub,
      id,
      query.page,
      query.limit,
    );
  }

  @Get(':id/welfare-cases')
  @SkipPhoneEnforcement()
  memberWelfareCases(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.memberProfile.getWelfareCases(
      user.sub,
      id,
      limit ? Number(limit) : 20,
    );
  }

  @Get(':id/timeline')
  @SkipPhoneEnforcement()
  timeline(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.memberTimeline.getTimeline(
      user.sub,
      id,
      limit ? Number(limit) : 100,
    );
  }

  @Patch(':id/profile')
  @SkipPhoneEnforcement()
  upsertProfile(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMemberProfileDto,
  ) {
    return this.memberProfile.upsertProfile(user.sub, id, dto);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MEMBER_MANAGE)
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(id);
  }

  @Get(':id/availability')
  @RequirePermissions(PERMISSIONS.ASSIGNMENT_WRITE)
  availability(
    @Param('id') id: string,
    @Query('eventId') eventId?: string,
  ) {
    return this.membersService.getAvailability(id, eventId);
  }

  @Get(':id/scores')
  @RequirePermissions(PERMISSIONS.EVENT_READ)
  scores(@Param('id') id: string) {
    return this.membersService.getScores(id);
  }

  @Get(':id/scores/trends')
  @RequirePermissions(PERMISSIONS.EVENT_READ)
  scoreTrends(
    @Param('id') id: string,
    @Query('months') months?: string,
  ) {
    return this.membersService.getScoreTrends(
      id,
      months ? Number(months) : 6,
    );
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.MEMBER_MANAGE)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateMemberStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.membersService.updateStatus(id, dto, user.sub);
  }
}
