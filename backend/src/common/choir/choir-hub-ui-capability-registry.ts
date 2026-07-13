/** Choir hub (`/choir`) tile UI capabilities — compose existing choir capabilities. */
export type ChoirHubUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const CHOIR_HUB_UI_CAPABILITY_REGISTRY: ChoirHubUiCapabilityDefinition[] =
  [
    {
      id: 'hub-new-activity',
      label: 'Create choir activity',
      routeSegments: [],
      requireAnyOf: ['choir.ops.manage@choir'],
      mode: 'any',
    },
    {
      id: 'hub-attendance-link',
      label: 'Mark attendance from hub',
      routeSegments: [],
      requireAnyOf: [
        'choir.ops.attendance@choir',
        'choir.member.view@choir',
      ],
      mode: 'any',
    },
    {
      id: 'hub-pending-approvals',
      label: 'Member onboarding',
      routeSegments: [],
      requireAnyOf: [
        'choir.member.manage@choir',
        'choir.ops.manage@choir',
      ],
      mode: 'any',
    },
    {
      id: 'hub-welfare-alerts',
      label: 'Active welfare alerts',
      routeSegments: [],
      requireAnyOf: [
        'choir.welfare.view@choir',
        'choir.welfare.manage@choir',
        'choir.discipline.manage@choir',
      ],
      mode: 'any',
    },
    {
      id: 'hub-pending-swaps',
      label: 'Pending schedule swaps',
      routeSegments: [],
      requireAnyOf: [
        'choir.ops.view@choir',
        'choir.ops.manage@choir',
        'choir.ops.schedule@choir',
      ],
      mode: 'any',
    },
  ];

export function uiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const def = CHOIR_HUB_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
}
