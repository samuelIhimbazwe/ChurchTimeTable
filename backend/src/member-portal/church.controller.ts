import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ChurchBroadcastType } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ChurchBroadcastsService } from './church-broadcasts.service';

@Controller('church')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class ChurchController {
  constructor(private broadcasts: ChurchBroadcastsService) {}

  @Get('broadcasts')
  list() {
    return this.broadcasts.list();
  }

  @Get('broadcasts/live')
  listLive() {
    return this.broadcasts.listLive();
  }

  @Post('broadcasts')
  create(
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      title: string;
      description?: string;
      youtubeUrl: string;
      thumbnail?: string;
      broadcastType?: ChurchBroadcastType;
      startAt?: string;
      endAt?: string;
      isLive?: boolean;
    },
  ) {
    return this.broadcasts.create(userId, body);
  }
}
