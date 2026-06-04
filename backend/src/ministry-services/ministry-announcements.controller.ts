import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MinistryAnnouncementsService } from './ministry-announcements.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireAnyPermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import {
  CreateMinistryAnnouncementDto,
  UpdateMinistryAnnouncementDto,
} from './dto/ministry-announcement.dto';

@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class MinistryAnnouncementsController {
  constructor(private service: MinistryAnnouncementsService) {}

  @Get(':id')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_VIEW,
    PERMISSIONS.MINISTRY_ANNOUNCEMENT_VIEW,
    PERMISSIONS.MINISTRY_ANNOUNCEMENT_MANAGE,
  )
  getById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.getById(user.sub, id);
  }

  @Post()
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_ANNOUNCEMENT_MANAGE,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateMinistryAnnouncementDto) {
    return this.service.create(user.sub, dto);
  }

  @Patch(':id')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_ANNOUNCEMENT_MANAGE,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMinistryAnnouncementDto,
  ) {
    return this.service.update(user.sub, id, dto);
  }

  @Delete(':id')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_ANNOUNCEMENT_MANAGE,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.remove(user.sub, id);
  }

  @Post(':id/publish')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_ANNOUNCEMENT_MANAGE,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  publish(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.publish(user.sub, id);
  }

  @Post(':id/pin')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_ANNOUNCEMENT_MANAGE,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  pin(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.pin(user.sub, id);
  }

  @Post(':id/read')
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_VIEW,
    PERMISSIONS.MINISTRY_ANNOUNCEMENT_VIEW,
  )
  read(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.markRead(user.sub, id);
  }
}

@Controller('ministries/:ministryId/announcements')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class MinistryAnnouncementsNestedController {
  constructor(private service: MinistryAnnouncementsService) {}

  @Get()
  @RequireAnyPermissions(
    PERMISSIONS.MINISTRY_VIEW,
    PERMISSIONS.MINISTRY_ANNOUNCEMENT_VIEW,
  )
  list(@CurrentUser() user: JwtPayload, @Param('ministryId') ministryId: string) {
    return this.service.listByMinistry(user.sub, ministryId);
  }
}
