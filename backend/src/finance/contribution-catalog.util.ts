import { ContributionType, FinanceCategory } from '@prisma/client';

/** Maps catalog codes to legacy enum for backward-compatible storage. */
export function legacyContributionTypeFromCatalogCode(
  code: string,
): ContributionType {
  const normalized = code.toLowerCase();
  switch (normalized) {
    case 'umusanzu':
      return ContributionType.OFFERING;
    case 'inyubako':
      return ContributionType.BUILDING_FUND;
    case 'uniform':
    case 'concert':
    case 'live_recording':
    case 'special_project':
      return ContributionType.SPECIAL;
    default:
      return ContributionType.OTHER;
  }
}

/** Maps legacy contribution type to finance ledger category. */
export function financeCategoryFromContributionType(
  contributionType: ContributionType,
): FinanceCategory {
  switch (contributionType) {
    case ContributionType.TITHE:
    case ContributionType.OFFERING:
    case ContributionType.MISSIONS:
      return FinanceCategory.DONATION;
    case ContributionType.BUILDING_FUND:
      return FinanceCategory.PROJECT;
    case ContributionType.SPECIAL:
      return FinanceCategory.OTHER;
    default:
      return FinanceCategory.OTHER;
  }
}
