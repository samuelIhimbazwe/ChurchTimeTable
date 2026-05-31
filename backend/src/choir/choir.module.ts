import { Module } from '@nestjs/common';
import { ChoirRotationService } from './choir-rotation.service';
import { ChoirController } from './choir.controller';
import { AssignmentsModule } from '../assignments/assignments.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';

@Module({
  imports: [AssignmentsModule, MemberPhoneEnforcementModule],
  controllers: [ChoirController],
  providers: [ChoirRotationService],
  exports: [ChoirRotationService],
})
export class ChoirModule {}
