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
import { DevotionType } from '@prisma/client';
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
import { ChoirId } from '../common/decorators/choir-id.decorator';
import { SkipPhoneEnforcement } from '../common/decorators/skip-phone-enforcement.decorator';
import { DevotionsService } from './devotions.service';
import {
  CreateDevotionDto,
  ListDevotionsQueryDto,
  UpdateDevotionDto,
} from './dto/devotion.dto';

const DEVOTION_VIEW = [
  PERMISSIONS.CHOIR_DEVOTION_VIEW,
  PERMISSIONS.CHOIR_DEVOTION_CREATE,
  PERMISSIONS.CHOIR_DEVOTION_PUBLISH,
  PERMISSIONS.CHOIR_DEVOTION_MANAGE,
] as const;

@Controller('choir/devotions')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class DevotionsController {
  constructor(private devotions: DevotionsService) {}

  @Get('widget')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...DEVOTION_VIEW)
  widget(@CurrentUser() user: JwtPayload, @ChoirId() choirId: string) {
    return this.devotions.widgetFeed(user.sub, choirId);
  }

  @Get()
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...DEVOTION_VIEW)
  list(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Query() query: ListDevotionsQueryDto,
  ) {
    const pinned =
      query.pinned === 'true'
        ? true
        : query.pinned === 'false'
          ? false
          : undefined;
    return this.devotions.list(user.sub, choirId, { type: query.type, pinned });
  }

  @Get('manage')
  @RequirePermissions(PERMISSIONS.CHOIR_DEVOTION_MANAGE)
  manageList(@CurrentUser() user: JwtPayload, @ChoirId() choirId: string) {
    return this.devotions.listAllForManage(user.sub, choirId);
  }

  @Get('bookmarks')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...DEVOTION_VIEW)
  bookmarks(@CurrentUser() user: JwtPayload, @ChoirId() choirId: string) {
    return this.devotions.listBookmarks(user.sub, choirId);
  }

  @Get(':id')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...DEVOTION_VIEW)
  getOne(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Param('id') id: string,
  ) {
    return this.devotions.getById(user.sub, choirId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CHOIR_DEVOTION_CREATE)
  create(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Body() dto: CreateDevotionDto,
  ) {
    return this.devotions.create(user.sub, choirId, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.CHOIR_DEVOTION_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDevotionDto,
  ) {
    return this.devotions.update(user.sub, choirId, id, dto);
  }

  @Post(':id/publish')
  @RequirePermissions(PERMISSIONS.CHOIR_DEVOTION_PUBLISH)
  publish(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Param('id') id: string,
  ) {
    return this.devotions.publish(user.sub, choirId, id);
  }

  @Post(':id/pin')
  @RequirePermissions(PERMISSIONS.CHOIR_DEVOTION_MANAGE)
  pin(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Param('id') id: string,
  ) {
    return this.devotions.pin(user.sub, choirId, id);
  }

  @Post(':id/bookmark')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...DEVOTION_VIEW)
  bookmark(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Param('id') id: string,
  ) {
    return this.devotions.bookmark(user.sub, choirId, id);
  }

  @Delete(':id/bookmark')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...DEVOTION_VIEW)
  removeBookmark(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.devotions.removeBookmark(user.sub, id);
  }
}
