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
import { UpdateMemberStatusDto } from './dto/update-member-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.EVENT_READ)
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

  @Get(':id')
  @RequirePermissions(PERMISSIONS.EVENT_READ)
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
