import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WelfareModule } from '../welfare/welfare.module';
import { MusicModule } from '../music/music.module';
import { RehearsalsModule } from '../rehearsals/rehearsals.module';
import { ReportsModule } from '../reports/reports.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { ChoirsModule } from '../choirs/choirs.module';
import { ChoirReportsController } from './choir-reports.controller';
import { ChoirReportsService } from './choir-reports.service';

@Module({
  imports: [
    AuthModule,
    WelfareModule,
    MusicModule,
    RehearsalsModule,
    ReportsModule,
    MemberPhoneEnforcementModule,
    forwardRef(() => ChoirsModule),
  ],
  controllers: [ChoirReportsController],
  providers: [ChoirReportsService],
})
export class ChoirReportsModule {}
