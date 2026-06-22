import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { WelfareCapabilityResolverService } from './welfare-capability-resolver.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [WelfareCapabilityResolverService],
  exports: [WelfareCapabilityResolverService],
})
export class WelfareCapabilityModule {}
