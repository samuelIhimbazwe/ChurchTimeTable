import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { DevotionCapabilityResolverService } from './devotion-capability-resolver.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [DevotionCapabilityResolverService],
  exports: [DevotionCapabilityResolverService],
})
export class DevotionCapabilityModule {}
