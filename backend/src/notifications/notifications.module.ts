import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { FcmService } from './fcm.service';
import { PrismaModule } from '../prisma/prisma.module';
import { I18nModule } from '../i18n/i18n.module';
import { ChoirNotificationsService } from '../choir-mvp/choir-notifications.service';

@Module({
  imports: [PrismaModule, I18nModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, FcmService, ChoirNotificationsService],
  exports: [NotificationsService, FcmService, ChoirNotificationsService],
})
export class NotificationsModule {}
