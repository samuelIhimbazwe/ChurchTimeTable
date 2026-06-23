/** Advisor hub (`/choir/advisor`) composite UI capabilities. */
export type AdvisorHubUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const ADVISOR_HUB_UI_CAPABILITY_REGISTRY: AdvisorHubUiCapabilityDefinition[] =
  [
    {
      id: 'advisor-hub',
      label: 'Advisor hub',
      routeSegments: ['advisor'],
      requireAnyOf: [
        'choir.ops.view@choir',
        'choir.discipline.view@choir',
        'choir.rehearsal.view@choir',
        'choir.voice.view@choir',
      ],
      mode: 'any',
    },
  ];

export function uiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const def = ADVISOR_HUB_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
}
