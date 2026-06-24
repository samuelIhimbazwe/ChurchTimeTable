/** UI-facing capability IDs — must stay in sync with backend (see welfare-capability-contract.spec.ts). */
export type WelfareUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const WELFARE_UI_CAPABILITY_REGISTRY: WelfareUiCapabilityDefinition[] = [
  {
    id: 'welfare-desk',
    label: 'Welfare cases',
    routeSegments: ['welfare'],
    requireAnyOf: ['choir.welfare.view@choir', 'choir.welfare.manage@choir'],
    mode: 'any',
  },
  {
    id: 'welfare-case-detail',
    label: 'Welfare case detail',
    routeSegments: ['welfare', 'cases'],
    requireAnyOf: ['choir.welfare.view@choir', 'choir.welfare.manage@choir'],
    mode: 'any',
  },
  {
    id: 'welfare-manage',
    label: 'Manage welfare cases',
    routeSegments: ['welfare'],
    requireAnyOf: ['choir.welfare.manage@choir'],
    mode: 'any',
  },
  {
    id: 'welfare-care-inbox',
    label: 'Care desk inbox',
    routeSegments: ['care', 'desk'],
    requireAnyOf: ['choir.welfare.view@choir', 'choir.welfare.manage@choir'],
    mode: 'any',
  },
];

export function uiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const def = WELFARE_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
}

export function isWelfareUiCapability(uiId: string): boolean {
  return WELFARE_UI_CAPABILITY_REGISTRY.some((d) => d.id === uiId);
}
