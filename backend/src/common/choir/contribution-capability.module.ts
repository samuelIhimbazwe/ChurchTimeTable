import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { ContributionCapabilityResolverService } from './contribution-capability-resolver.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [ContributionCapabilityResolverService],
  exports: [ContributionCapabilityResolverService],
})
export class ContributionCapabilityModule {}
