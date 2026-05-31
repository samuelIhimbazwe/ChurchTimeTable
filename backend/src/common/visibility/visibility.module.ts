import { Global, Module } from '@nestjs/common';
import { ResponseVisibilityService } from './response-visibility.service';

@Global()
@Module({
  providers: [ResponseVisibilityService],
  exports: [ResponseVisibilityService],
})
export class VisibilityModule {}
