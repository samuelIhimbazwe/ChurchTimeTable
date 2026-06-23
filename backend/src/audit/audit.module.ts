import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { ChoirHttpAccessModule } from '../common/choir/choir-http-access.module';

@Global()
@Module({
  imports: [ChoirHttpAccessModule],
  providers: [AuditService],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}
