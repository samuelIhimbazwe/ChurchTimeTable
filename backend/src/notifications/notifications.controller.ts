import { Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  list(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('archived') archived?: string,
    @Query('q') q?: string,
    @Query('type') type?: NotificationType,
  ) {
    return this.notificationsService.listForUser(
      userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      {
        unreadOnly: unreadOnly === 'true',
        archived: archived === 'true',
        q,
        type,
      },
    );
  }

  @Post('mark-all-read')
  markAllRead(@CurrentUser('sub') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.notificationsService.markRead(id, userId);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.notificationsService.archive(id, userId);
  }

  @Patch(':id/unarchive')
  unarchive(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.notificationsService.unarchive(id, userId);
  }
}
