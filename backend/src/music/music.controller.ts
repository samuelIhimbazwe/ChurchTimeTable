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
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { ListSongsQueryDto } from './dto/list-songs-query.dto';
import { SkipPhoneEnforcement } from '../common/decorators/skip-phone-enforcement.decorator';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { CreateSongAssetDto } from './dto/create-song-asset.dto';

@Controller('choir/music')
@UseGuards(JwtAuthGuard, RolesGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class MusicController {
  constructor(private music: MusicService) {}

  @Get('categories')
  @SkipPhoneEnforcement()
  @RequireUiCapability('music-library-hub')
  listCategories() {
    return this.music.listCategories();
  }

  @Get('analytics')
  @RequireUiCapability('music-library-hub')
  analytics(@CurrentUser() user: JwtPayload) {
    return this.music.analytics(user.sub);
  }

  @Get('favorites')
  @SkipPhoneEnforcement()
  @RequireUiCapability('music-library-hub')
  favorites(@CurrentUser() user: JwtPayload) {
    return this.music.listFavorites(user.sub);
  }

  @Get('songs')
  @SkipPhoneEnforcement()
  @RequireUiCapability('music-library-hub')
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
  @RequireUiCapability('music-library-hub')
  getSong(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.music.getSong(user.sub, id);
  }

  @Post('songs')
  @RequireUiCapability('music-library-manage')
  createSong(@CurrentUser() user: JwtPayload, @Body() dto: CreateSongDto) {
    return this.music.createSong(user.sub, dto);
  }

  @Patch('songs/:id')
  @RequireUiCapability('music-library-manage')
  updateSong(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSongDto,
  ) {
    return this.music.updateSong(user.sub, id, dto);
  }

  @Post('songs/:id/assets')
  @RequireUiCapability('music-library-manage')
  addAsset(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateSongAssetDto,
  ) {
    return this.music.addAsset(user.sub, id, dto);
  }

  @Post('songs/:id/favorite')
  @SkipPhoneEnforcement()
  @RequireUiCapability('music-library-hub')
  toggleFavorite(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.music.toggleFavorite(user.sub, id);
  }
}
