/** UI-facing capability IDs — stable keys for nav and page guards. */
export type ContributionUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  /** Backing capability id(s); all must pass for action gates, any for nav visibility */
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const CONTRIBUTION_UI_CAPABILITY_REGISTRY: ContributionUiCapabilityDefinition[] =
  [
    {
      id: 'contribution-submit',
      label: 'Submit contribution',
      routeSegments: ['membership', 'giving'],
      requireAnyOf: ['choir.contribution.submit@self'],
      mode: 'any',
    },
    {
      id: 'contribution-family-inbox',
      label: 'Family contribution inbox',
      routeSegments: ['family-leadership', 'contributions'],
      requireAnyOf: ['choir.contribution.view@family'],
      mode: 'any',
    },
    {
      id: 'contribution-family-approve',
      label: 'Approve family contributions',
      routeSegments: ['family-leadership', 'contributions'],
      requireAnyOf: ['choir.contribution.approve@family'],
      mode: 'any',
    },
    {
      id: 'contribution-treasury-verify',
      label: 'Treasury verification',
      routeSegments: ['budget', 'verify'],
      requireAnyOf: ['choir.contribution.verify@choir'],
      mode: 'any',
    },
    {
      id: 'contribution-stewardship',
      label: 'Stewardship dashboard',
      routeSegments: ['stewardship'],
      requireAnyOf: ['choir.contribution.view@choir'],
      mode: 'any',
    },
    {
      id: 'contribution-catalog',
      label: 'Contribution catalog',
      routeSegments: ['stewardship', 'admin'],
      requireAnyOf: ['choir.contribution.catalog.manage@choir'],
      mode: 'any',
    },
    {
      id: 'contribution-finance-overview',
      label: 'Finance overview',
      routeSegments: ['finance'],
      requireAnyOf: ['choir.contribution.view@choir'],
      mode: 'any',
    },
    {
      id: 'contribution-budget-hub',
      label: 'Budget hub',
      routeSegments: ['budget'],
      requireAnyOf: [
        'choir.budget.view@choir',
        'choir.budget.manage@choir',
        'choir.contribution.verify@choir',
      ],
      mode: 'any',
    },
  ];

export function uiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string, scopeId?: string) => boolean,
  scopeId?: string,
): boolean {
  const def = CONTRIBUTION_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap, scopeId));
  }
  return def.requireAnyOf.some((cap) => check(cap, scopeId));
}
