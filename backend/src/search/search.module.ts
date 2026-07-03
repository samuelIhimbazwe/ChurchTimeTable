import { Module } from '@nestjs/common';
import { GovernanceModule } from '../governance/governance.module';
import { FamiliesModule } from '../families/families.module';
import { MinistriesModule } from '../ministries/ministries.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [
    GovernanceModule,
    FamiliesModule,
    MinistriesModule,
    MemberPhoneEnforcementModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
