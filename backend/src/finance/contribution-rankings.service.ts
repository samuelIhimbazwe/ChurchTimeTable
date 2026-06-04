import { Injectable } from '@nestjs/common';
import { ContributionTotalsService } from './contribution-totals.service';

/**
 * Rankings facade — all aggregation delegated to ContributionTotalsService (v1.3).
 */
@Injectable()
export class ContributionRankingsService {
  constructor(private totals: ContributionTotalsService) {}

  getRankings(
    actorUserId: string,
    query: { familyId?: string; limit?: number; from?: string; to?: string },
  ) {
    return this.totals.buildRankings(actorUserId, query);
  }
}
