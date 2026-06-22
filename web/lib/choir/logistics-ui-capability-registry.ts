/** UI-facing capability IDs — must stay in sync with backend (see logistics-capability-contract.spec.ts). */
export type LogisticsUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const LOGISTICS_UI_CAPABILITY_REGISTRY: LogisticsUiCapabilityDefinition[] =
  [
    {
      id: 'logistics-documents-hub',
      label: 'Choir documents',
      routeSegments: ['documents'],
      requireAnyOf: [
        'choir.document.view@choir',
        'choir.document.manage@choir',
      ],
      mode: 'any',
    },
    {
      id: 'logistics-documents-manage',
      label: 'Manage choir documents',
      routeSegments: ['documents'],
      requireAnyOf: ['choir.document.manage@choir'],
      mode: 'any',
    },
    {
      id: 'logistics-assets-hub',
      label: 'Choir assets',
      routeSegments: ['assets'],
      requireAnyOf: [
        'choir.uniform.view@choir',
        'choir.uniform.manage@choir',
        'choir.equipment.view@choir',
        'choir.equipment.manage@choir',
      ],
      mode: 'any',
    },
    {
      id: 'logistics-uniform-manage',
      label: 'Manage uniforms',
      routeSegments: ['assets'],
      requireAnyOf: ['choir.uniform.manage@choir', 'choir.ops.manage@choir'],
      mode: 'any',
    },
    {
      id: 'logistics-equipment-manage',
      label: 'Manage equipment',
      routeSegments: ['assets'],
      requireAnyOf: ['choir.equipment.manage@choir', 'choir.ops.manage@choir'],
      mode: 'any',
    },
  ];

export function uiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const def = LOGISTICS_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
}

export function isLogisticsUiCapability(uiId: string): boolean {
  return LOGISTICS_UI_CAPABILITY_REGISTRY.some((d) => d.id === uiId);
}
