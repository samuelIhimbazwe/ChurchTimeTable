import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { ChoirOperationsController } from './choir-operations.controller';
import { ChoirDocumentsService } from './choir-documents.service';
import { ChoirMeetingsService } from './choir-meetings.service';
import { ChoirUniformsService } from './choir-uniforms.service';
import { ChoirEquipmentService } from './choir-equipment.service';

@Module({
  imports: [AuthModule, MemberPhoneEnforcementModule],
  controllers: [ChoirOperationsController],
  providers: [
    ChoirDocumentsService,
    ChoirMeetingsService,
    ChoirUniformsService,
    ChoirEquipmentService,
  ],
  exports: [
    ChoirDocumentsService,
    ChoirMeetingsService,
    ChoirUniformsService,
    ChoirEquipmentService,
  ],
})
export class ChoirOperationsModule {}
