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
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import {
  CreateMinistryAnnouncementDto,
  UpdateMinistryAnnouncementDto,
} from './dto/ministry-announcement.dto';

@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class MinistryAnnouncementsController {
  constructor(private service: MinistryAnnouncementsService) {}

  @Get(':id')
  @RequireUiCapability('ministry-announcement-view')
  getById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.getById(user.sub, id);
  }

  @Post()
  @RequireUiCapability('ministry-announcement-manage')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateMinistryAnnouncementDto) {
    return this.service.create(user.sub, dto);
  }

  @Patch(':id')
  @RequireUiCapability('ministry-announcement-manage')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMinistryAnnouncementDto,
  ) {
    return this.service.update(user.sub, id, dto);
  }

  @Delete(':id')
  @RequireUiCapability('ministry-announcement-manage')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.remove(user.sub, id);
  }

  @Post(':id/publish')
  @RequireUiCapability('ministry-announcement-manage')
  publish(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.publish(user.sub, id);
  }

  @Post(':id/pin')
  @RequireUiCapability('ministry-announcement-manage')
  pin(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.pin(user.sub, id);
  }

  @Post(':id/read')
  @RequireUiCapability('ministry-announcement-view')
  read(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.markRead(user.sub, id);
  }
}

@Controller('ministries/:ministryId/announcements')
@UseGuards(JwtAuthGuard, RolesGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class MinistryAnnouncementsNestedController {
  constructor(private service: MinistryAnnouncementsService) {}

  @Get()
  @RequireUiCapability('ministry-announcement-view')
  list(@CurrentUser() user: JwtPayload, @Param('ministryId') ministryId: string) {
    return this.service.listByMinistry(user.sub, ministryId);
  }
}
