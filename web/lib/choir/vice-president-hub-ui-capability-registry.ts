/** Vice President hub (`/choir/vice-president`) composite UI capabilities. */
export type VicePresidentHubUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const VICE_PRESIDENT_HUB_UI_CAPABILITY_REGISTRY: VicePresidentHubUiCapabilityDefinition[] =
  [
    {
      id: 'vice-president-hub',
      label: 'Vice President hub',
      routeSegments: ['vice-president'],
      requireAnyOf: [
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
  const def = VICE_PRESIDENT_HUB_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
}

export function isVicePresidentHubUiCapability(uiId: string): boolean {
  return VICE_PRESIDENT_HUB_UI_CAPABILITY_REGISTRY.some((d) => d.id === uiId);
}
