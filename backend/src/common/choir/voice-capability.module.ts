import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { VoiceCapabilityResolverService } from './voice-capability-resolver.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [VoiceCapabilityResolverService],
  exports: [VoiceCapabilityResolverService],
})
export class VoiceCapabilityModule {}
