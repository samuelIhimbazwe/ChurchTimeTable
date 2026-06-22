import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { SponsorCapabilityResolverService } from './sponsor-capability-resolver.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [SponsorCapabilityResolverService],
  exports: [SponsorCapabilityResolverService],
})
export class SponsorCapabilityModule {}
