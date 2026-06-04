import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { DevotionsService } from '../devotions/devotions.service';
import { CreateDevotionDto } from '../devotions/dto/devotion.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireAnyPermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('ministries/:ministryId/devotions')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class MinistryDevotionsController {
  constructor(private devotions: DevotionsService) {}

  @Get()
  @RequireAnyPermissions(PERMISSIONS.MINISTRY_VIEW, PERMISSIONS.CHOIR_DEVOTION_VIEW)
  list(@Param('ministryId') ministryId: string) {
    return this.devotions.listForMinistry(ministryId);
  }

  @Post()
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_DEVOTION_CREATE,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  create(
    @CurrentUser() user: JwtPayload,
    @Param('ministryId') ministryId: string,
    @Body() dto: CreateDevotionDto,
  ) {
    return this.devotions.createForMinistry(user.sub, ministryId, dto);
  }

  @Post(':id/publish')
  @RequireAnyPermissions(
    PERMISSIONS.CHOIR_DEVOTION_PUBLISH,
    PERMISSIONS.MINISTRY_MANAGE,
  )
  publish(
    @CurrentUser() user: JwtPayload,
    @Param('ministryId') ministryId: string,
    @Param('id') id: string,
  ) {
    return this.devotions.publishMinistryDevotion(user.sub, ministryId, id);
  }
}
