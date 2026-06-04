import { Module } from '@nestjs/common';
import { WelfareModule } from '../welfare/welfare.module';
import { MusicModule } from '../music/music.module';
import { RehearsalsModule } from '../rehearsals/rehearsals.module';
import { ChoirReportsModule } from '../choir-reports/choir-reports.module';
import { ChoirOperationsModule } from '../choir-operations/choir-operations.module';
import { DevotionsModule } from '../devotions/devotions.module';
import { ChoirCustomRolesModule } from '../choir-custom-roles/choir-custom-roles.module';

@Module({
  imports: [
    WelfareModule,
    MusicModule,
    RehearsalsModule,
    ChoirReportsModule,
    ChoirOperationsModule,
    DevotionsModule,
    ChoirCustomRolesModule,
  ],
  exports: [
    WelfareModule,
    MusicModule,
    RehearsalsModule,
    ChoirReportsModule,
    ChoirOperationsModule,
    DevotionsModule,
    ChoirCustomRolesModule,
  ],
})
export class ChoirMvpModule {}
