/** President hub (`/choir/president`) composite UI capabilities. */
export type PresidentHubUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const PRESIDENT_HUB_UI_CAPABILITY_REGISTRY: PresidentHubUiCapabilityDefinition[] =
  [
    {
      id: 'president-hub',
      label: 'President hub',
      routeSegments: ['president'],
      requireAnyOf: [
        'choir.join.review@choir',
        'choir.member.manage@choir',
        'choir.ops.view@choir',
        'choir.ops.manage@choir',
      ],
      mode: 'any',
    },
  ];

export function uiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const def = PRESIDENT_HUB_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
}

export function isPresidentHubUiCapability(uiId: string): boolean {
  return PRESIDENT_HUB_UI_CAPABILITY_REGISTRY.some((d) => d.id === uiId);
}
