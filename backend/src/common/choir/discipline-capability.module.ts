import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { DisciplineCapabilityResolverService } from './discipline-capability-resolver.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [DisciplineCapabilityResolverService],
  exports: [DisciplineCapabilityResolverService],
})
export class DisciplineCapabilityModule {}
