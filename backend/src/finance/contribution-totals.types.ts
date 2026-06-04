export type ContributionTotalsScopeMode = 'own' | 'family' | 'choir';

export interface ContributionTotalsScope {
  mode: ContributionTotalsScopeMode;
  memberId?: string;
  familyId?: string;
  familyIds?: string[];
}

export type ContributionTotalsScopeHint = 'own' | 'family' | 'choir';

export interface ContributionTotalsQuery {
  /** v1.3 — force personal totals even when actor has choir-wide access */
  scope?: ContributionTotalsScopeHint;
  familyId?: string;
  contributionTypeCatalogId?: string;
  contributionCampaignId?: string;
  from?: string;
  to?: string;
  includeArchived?: boolean;
}
