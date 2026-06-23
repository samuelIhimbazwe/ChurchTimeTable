import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { FamilyHttpAccessService } from './family-http-access.service';
import { ChoirReportsHttpAccessService } from './choir-reports-http-access.service';
import { UiCapabilityGuard } from '../guards/ui-capability.guard';

@Module({
  imports: [AuthModule],
  providers: [
    FamilyHttpAccessService,
    ChoirReportsHttpAccessService,
    UiCapabilityGuard,
  ],
  exports: [
    FamilyHttpAccessService,
    ChoirReportsHttpAccessService,
    UiCapabilityGuard,
  ],
})
export class ChoirHttpAccessModule {}
