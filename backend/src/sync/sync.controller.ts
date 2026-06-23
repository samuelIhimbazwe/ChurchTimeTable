import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncBatchDto } from './dto/sync-batch.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('sync')
@UseGuards(JwtAuthGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Post('batch')
  @RequireUiCapability('admin-sync-manage')
  batch(@Body() dto: SyncBatchDto, @CurrentUser() user: JwtPayload) {
    return this.syncService.processBatch(user.sub, dto);
  }

  @Get('conflicts')
  @RequireUiCapability('admin-sync-manage')
  conflicts(@CurrentUser('sub') userId: string) {
    return this.syncService.getConflicts(userId);
  }
}
