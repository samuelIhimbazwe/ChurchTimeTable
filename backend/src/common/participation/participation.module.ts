import { Module } from '@nestjs/common';
import { ParticipationScoringService } from './participation-scoring.service';
import { ParticipationRecordsService } from './participation-records.service';
import { ParticipationGovernanceService } from './participation-governance.service';

@Module({
  providers: [
    ParticipationScoringService,
    ParticipationRecordsService,
    ParticipationGovernanceService,
  ],
  exports: [
    ParticipationScoringService,
    ParticipationRecordsService,
    ParticipationGovernanceService,
  ],
})
export class ParticipationModule {}
