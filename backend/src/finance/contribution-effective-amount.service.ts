import { Injectable } from '@nestjs/common';
import type { ContributionAdjustment, Prisma } from '@prisma/client';
import {
  computeEffectiveAmount,
  toNumber,
} from './contribution-effective.util';

export type ContributionAdjustmentSlice = Pick<
  ContributionAdjustment,
  'adjustmentAmount'
>;

export type ConfirmedContributionRow = {
  id: string;
  memberId: string;
  familyId: string | null;
  contributionTypeCatalogId: string | null;
  contributionCampaignId: string | null;
  confirmedAmount: Prisma.Decimal | null;
  amount: Prisma.Decimal;
  claimedAmount?: Prisma.Decimal | null;
  paymentAt?: Date | null;
  familyApprovedAt?: Date | null;
  adjustments: ContributionAdjustmentSlice[];
};

@Injectable()
export class ContributionEffectiveAmountService {
  /** effectiveAmount = confirmedAmount + Σ(adjustmentAmount) */
  compute(
    confirmedAmount: Prisma.Decimal | number | string | null | undefined,
    adjustments: ContributionAdjustmentSlice[],
  ): number {
    return computeEffectiveAmount(confirmedAmount, adjustments);
  }

  computeFromRow(row: ConfirmedContributionRow): number {
    return this.compute(row.confirmedAmount ?? row.amount, row.adjustments);
  }

  sumRows(rows: ConfirmedContributionRow[]): number {
    return rows.reduce((sum, row) => sum + this.computeFromRow(row), 0);
  }

  serializeAmounts(row: ConfirmedContributionRow) {
    return {
      claimedAmount: toNumber(row.claimedAmount ?? row.amount),
      confirmedAmount: toNumber(row.confirmedAmount ?? row.amount),
      effectiveAmount: this.computeFromRow(row),
      adjustmentCount: row.adjustments.length,
    };
  }
}
