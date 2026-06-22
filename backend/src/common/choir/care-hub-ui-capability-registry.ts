/** Care hub (`/choir/care`) composite UI capabilities. */
export type CareHubUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const CARE_HUB_UI_CAPABILITY_REGISTRY: CareHubUiCapabilityDefinition[] =
  [
    {
      id: 'care-hub',
      label: 'Care & discipline hub',
      routeSegments: ['care'],
      requireAnyOf: [
        'choir.welfare.view@choir',
        'choir.welfare.manage@choir',
        'choir.discipline.view@choir',
        'choir.discipline.manage@choir',
        'choir.discipline.review@choir',
      ],
      mode: 'any',
    },
    {
      id: 'care-command-home',
      label: 'Care command home',
      routeSegments: ['care'],
      requireAnyOf: [
        'choir.welfare.view@choir',
        'choir.welfare.manage@choir',
      ],
      mode: 'any',
    },
    {
      id: 'care-rules-manage',
      label: 'Manage choir rules',
      routeSegments: ['care'],
      requireAnyOf: [
        'choir.document.manage@choir',
        'choir.discipline.manage@choir',
      ],
      mode: 'any',
    },
    {
      id: 'care-notices-send',
      label: 'Send member care notices',
      routeSegments: ['care'],
      requireAnyOf: [
        'choir.announcement.manage@choir',
        'choir.discipline.manage@choir',
      ],
      mode: 'any',
    },
  ];

export function uiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const def = CARE_HUB_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
}
