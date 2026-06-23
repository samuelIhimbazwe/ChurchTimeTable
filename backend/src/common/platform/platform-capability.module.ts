import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PlatformCapabilityResolverService } from './platform-capability-resolver.service';
import { PlatformHttpAccessService } from './platform-http-access.service';
import { ProtocolMembershipService } from '../../member-portal/protocol-membership.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [
    PlatformCapabilityResolverService,
    PlatformHttpAccessService,
    ProtocolMembershipService,
  ],
  exports: [PlatformCapabilityResolverService, PlatformHttpAccessService],
})
export class PlatformCapabilityModule {}
