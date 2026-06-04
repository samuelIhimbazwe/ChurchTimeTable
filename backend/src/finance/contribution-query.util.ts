import type { ContributionStatus, Prisma } from '@prisma/client';
import type { ContributionTotalsQuery, ContributionTotalsScope } from './contribution-totals.types';

const CHOIR_MEMBER_FILTER = { ministry: 'CHOIR' as const };

export function parseDateRange(query: {
  from?: string;
  to?: string;
}): { gte?: Date; lte?: Date } | undefined {
  const range: { gte?: Date; lte?: Date } = {};
  if (query.from) range.gte = new Date(query.from);
  if (query.to) range.lte = new Date(query.to);
  return Object.keys(range).length > 0 ? range : undefined;
}

export function buildRecordScopeWhere(
  scope: ContributionTotalsScope,
  query: ContributionTotalsQuery,
  status?: ContributionStatus,
): Prisma.ContributionRecordWhereInput {
  const paymentAt = parseDateRange(query);
  const where: Prisma.ContributionRecordWhereInput = {
    member: CHOIR_MEMBER_FILTER,
  };

  if (status) where.status = status;
  if (query.contributionTypeCatalogId) {
    where.contributionTypeCatalogId = query.contributionTypeCatalogId;
  }
  if (query.contributionCampaignId) {
    where.contributionCampaignId = query.contributionCampaignId;
  }
  if (paymentAt) where.paymentAt = paymentAt;

  if (scope.mode === 'own') {
    where.memberId = scope.memberId;
  } else if (scope.mode === 'family') {
    where.familyId = scope.familyId;
  }

  return where;
}
