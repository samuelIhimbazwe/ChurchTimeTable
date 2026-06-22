/** UI-facing capability IDs — must stay in sync with backend (see roster-capability-contract.spec.ts). */
export type RosterUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const ROSTER_UI_CAPABILITY_REGISTRY: RosterUiCapabilityDefinition[] = [
  {
    id: 'roster-hub',
    label: 'Choir roster',
    routeSegments: ['members'],
    requireAnyOf: [
      'choir.member.view@choir',
      'choir.member.manage@choir',
    ],
    mode: 'any',
  },
  {
    id: 'roster-manage',
    label: 'Manage choir roster',
    routeSegments: ['members'],
    requireAnyOf: ['choir.member.manage@choir'],
    mode: 'any',
  },
];

export function uiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const def = ROSTER_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
}

export function isRosterUiCapability(uiId: string): boolean {
  return ROSTER_UI_CAPABILITY_REGISTRY.some((d) => d.id === uiId);
}
