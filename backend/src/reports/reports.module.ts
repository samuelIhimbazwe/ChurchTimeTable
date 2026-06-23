import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { ParticipationModule } from '../common/participation/participation.module';
import { ChoirHttpAccessModule } from '../common/choir/choir-http-access.module';

@Module({
  imports: [MemberPhoneEnforcementModule, ParticipationModule, ChoirHttpAccessModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
