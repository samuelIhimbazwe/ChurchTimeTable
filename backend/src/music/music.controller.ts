import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MusicService } from './music.service';
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
import { ListSongsQueryDto } from './dto/list-songs-query.dto';
import { SkipPhoneEnforcement } from '../common/decorators/skip-phone-enforcement.decorator';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { CreateSongAssetDto } from './dto/create-song-asset.dto';

const MUSIC_VIEW_ANY = [
  PERMISSIONS.CHOIR_MUSIC_VIEW,
  PERMISSIONS.CHOIR_MUSIC_MANAGE,
] as const;

@Controller('choir/music')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class MusicController {
  constructor(private music: MusicService) {}

  @Get('categories')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...MUSIC_VIEW_ANY)
  listCategories() {
    return this.music.listCategories();
  }

  @Get('analytics')
  @RequireAnyPermissions(...MUSIC_VIEW_ANY)
  analytics(@CurrentUser() user: JwtPayload) {
    return this.music.analytics(user.sub);
  }

  @Get('favorites')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...MUSIC_VIEW_ANY)
  favorites(@CurrentUser() user: JwtPayload) {
    return this.music.listFavorites(user.sub);
  }

  @Get('songs')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...MUSIC_VIEW_ANY)
  listSongs(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListSongsQueryDto,
  ) {
    return this.music.listSongs(
      user.sub,
      query.page,
      query.limit,
      query.q,
      query.categoryId,
      query.language,
      query.choirId,
    );
  }

  @Get('songs/:id')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...MUSIC_VIEW_ANY)
  getSong(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.music.getSong(user.sub, id);
  }

  @Post('songs')
  @RequirePermissions(PERMISSIONS.CHOIR_MUSIC_MANAGE)
  createSong(@CurrentUser() user: JwtPayload, @Body() dto: CreateSongDto) {
    return this.music.createSong(user.sub, dto);
  }

  @Patch('songs/:id')
  @RequirePermissions(PERMISSIONS.CHOIR_MUSIC_MANAGE)
  updateSong(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSongDto,
  ) {
    return this.music.updateSong(user.sub, id, dto);
  }

  @Post('songs/:id/assets')
  @RequirePermissions(PERMISSIONS.CHOIR_MUSIC_MANAGE)
  addAsset(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateSongAssetDto,
  ) {
    return this.music.addAsset(user.sub, id, dto);
  }

  @Post('songs/:id/favorite')
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(...MUSIC_VIEW_ANY)
  toggleFavorite(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.music.toggleFavorite(user.sub, id);
  }
}
