import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { LogisticsCapabilityResolverService } from './logistics-capability-resolver.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [LogisticsCapabilityResolverService],
  exports: [LogisticsCapabilityResolverService],
})
export class LogisticsCapabilityModule {}
