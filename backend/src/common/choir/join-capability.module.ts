import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { JoinCapabilityResolverService } from './join-capability-resolver.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [JoinCapabilityResolverService],
  exports: [JoinCapabilityResolverService],
})
export class JoinCapabilityModule {}
