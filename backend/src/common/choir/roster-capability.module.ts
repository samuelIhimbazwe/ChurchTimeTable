import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { RosterCapabilityResolverService } from './roster-capability-resolver.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [RosterCapabilityResolverService],
  exports: [RosterCapabilityResolverService],
})
export class RosterCapabilityModule {}
