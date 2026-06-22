import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { RolesCapabilityResolverService } from './roles-capability-resolver.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [RolesCapabilityResolverService],
  exports: [RolesCapabilityResolverService],
})
export class RolesCapabilityModule {}
