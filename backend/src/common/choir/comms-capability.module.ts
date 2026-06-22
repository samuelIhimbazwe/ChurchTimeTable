import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { CommsCapabilityResolverService } from './comms-capability-resolver.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [CommsCapabilityResolverService],
  exports: [CommsCapabilityResolverService],
})
export class CommsCapabilityModule {}
