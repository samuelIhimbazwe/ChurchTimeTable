import { Prisma } from '@prisma/client';

/** Month boundaries for choir treasury period close (SAP FI month-end pattern). */

export type TreasuryPeriodBounds = {
  monthKey: string;
  label: string;
  from: Date;
  to: Date;
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function resolveTreasuryPeriodMonth(monthKey?: string): TreasuryPeriodBounds {
  const now = new Date();
  let year = now.getUTCFullYear();
  let monthIndex = now.getUTCMonth();

  if (monthKey) {
    const match = /^(\d{4})-(\d{2})$/.exec(monthKey.trim());
    if (!match) {
      throw new Error('Invalid month; use YYYY-MM');
    }
    year = Number(match[1]);
    monthIndex = Number(match[2]) - 1;
    if (monthIndex < 0 || monthIndex > 11) {
      throw new Error('Invalid month; use YYYY-MM');
    }
  }

  const from = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
  const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

  return {
    monthKey: key,
    label: `${MONTH_NAMES[monthIndex]} ${year}`,
    from,
    to,
  };
}

export function choirContributionScopeWhere(
  choirId: string,
  familyIds: string[],
): Prisma.ContributionRecordWhereInput {
  const familyBranch: Prisma.ContributionRecordWhereInput[] = familyIds.length
    ? [{ familyId: { in: familyIds } }]
    : [];

  return {
    OR: [...familyBranch, { choirId, familyId: null }],
  };
}
