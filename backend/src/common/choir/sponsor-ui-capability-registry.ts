export type SponsorUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const SPONSOR_UI_CAPABILITY_REGISTRY: SponsorUiCapabilityDefinition[] =
  [
    {
      id: 'sponsor-requests-desk',
      label: 'Sponsors',
      routeSegments: ['join-requests'],
      requireAnyOf: [
        'choir.sponsor.review@choir',
        'choir.member.manage@choir',
      ],
      mode: 'any',
    },
    {
      id: 'sponsor-requests-review',
      label: 'Manage sponsors',
      routeSegments: ['join-requests'],
      requireAnyOf: [
        'choir.sponsor.review@choir',
        'choir.member.manage@choir',
      ],
      mode: 'any',
    },
  ];

export function uiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const def = SPONSOR_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
}
