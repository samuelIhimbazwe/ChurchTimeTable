import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { OpsCapabilityResolverService } from './ops-capability-resolver.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [OpsCapabilityResolverService],
  exports: [OpsCapabilityResolverService],
})
export class OpsCapabilityModule {}
