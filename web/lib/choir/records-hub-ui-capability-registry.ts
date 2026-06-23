/** Records hub (`/choir/records`) composite UI capabilities. */
export type RecordsHubUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const RECORDS_HUB_UI_CAPABILITY_REGISTRY: RecordsHubUiCapabilityDefinition[] =
  [
    {
      id: 'records-hub',
      label: 'Records hub',
      routeSegments: ['records'],
      requireAnyOf: [
        'choir.document.view@choir',
        'choir.document.manage@choir',
        'choir.ops.view@choir',
      ],
      mode: 'any',
    },
  ];

export function uiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const def = RECORDS_HUB_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
}

export function isRecordsHubUiCapability(uiId: string): boolean {
  return RECORDS_HUB_UI_CAPABILITY_REGISTRY.some((d) => d.id === uiId);
}
