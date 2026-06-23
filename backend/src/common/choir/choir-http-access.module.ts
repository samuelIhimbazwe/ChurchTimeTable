import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PlatformCapabilityModule } from '../platform/platform-capability.module';
import { FamilyHttpAccessService } from './family-http-access.service';
import { ChoirReportsHttpAccessService } from './choir-reports-http-access.service';
import { UiCapabilityGuard } from '../guards/ui-capability.guard';

@Module({
  imports: [AuthModule, PlatformCapabilityModule],
  providers: [
    FamilyHttpAccessService,
    ChoirReportsHttpAccessService,
    UiCapabilityGuard,
  ],
  exports: [
    FamilyHttpAccessService,
    ChoirReportsHttpAccessService,
    UiCapabilityGuard,
    PlatformCapabilityModule,
  ],
})
export class ChoirHttpAccessModule {}
