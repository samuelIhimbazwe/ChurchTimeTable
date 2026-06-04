import { WelfareCaseStatus } from '@prisma/client';

export type WelfareCaseWithTotals = {
  requestedAmount: unknown;
  approvedAmount: unknown;
  contributions: { amount: unknown }[];
  assistance: { amount: unknown }[];
};

export function sumWelfareContributions(
  contributions: { amount: unknown }[],
): number {
  return contributions.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
}

export function sumWelfareAssistance(
  assistance: { amount: unknown }[],
): number {
  return assistance.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
}

export function enrichWelfareCaseFinancials<
  T extends WelfareCaseWithTotals,
>(row: T) {
  const raisedAmount = sumWelfareContributions(row.contributions ?? []);
  const assistanceTotal = sumWelfareAssistance(row.assistance ?? []);
  const approvedAmount = row.approvedAmount
    ? Number(row.approvedAmount)
    : null;
  const requestedAmount = row.requestedAmount
    ? Number(row.requestedAmount)
    : null;
  const remainingAmount =
    approvedAmount != null
      ? Math.max(0, approvedAmount - raisedAmount)
      : requestedAmount != null
        ? Math.max(0, requestedAmount - raisedAmount)
        : null;

  return {
    ...row,
    requestedAmount,
    approvedAmount,
    raisedAmount,
    assistanceTotal,
    remainingAmount,
  };
}

export const ACTIVE_WELFARE_STATUSES: WelfareCaseStatus[] = [
  WelfareCaseStatus.OPEN,
  WelfareCaseStatus.UNDER_REVIEW,
  WelfareCaseStatus.APPROVED,
  WelfareCaseStatus.ACTIVE_SUPPORT,
  WelfareCaseStatus.ACTIVE,
  WelfareCaseStatus.PARTIALLY_FUNDED,
  WelfareCaseStatus.FUNDED,
];
