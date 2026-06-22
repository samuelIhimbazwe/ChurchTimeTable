import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { MusicCapabilityResolverService } from './music-capability-resolver.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [MusicCapabilityResolverService],
  exports: [MusicCapabilityResolverService],
})
export class MusicCapabilityModule {}
