import type { ContributionAdjustment, Prisma } from '@prisma/client';

type DecimalLike = Prisma.Decimal | number | string | null | undefined;

export function toNumber(value: DecimalLike): number {
  if (value == null) return 0;
  return Number(value);
}

export function computeEffectiveAmount(
  confirmedAmount: DecimalLike,
  adjustments: Pick<ContributionAdjustment, 'adjustmentAmount'>[],
): number {
  const base = toNumber(confirmedAmount);
  const delta = adjustments.reduce(
    (sum, row) => sum + toNumber(row.adjustmentAmount),
    0,
  );
  return base + delta;
}
