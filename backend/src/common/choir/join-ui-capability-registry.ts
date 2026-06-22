export type JoinUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const JOIN_UI_CAPABILITY_REGISTRY: JoinUiCapabilityDefinition[] = [
  {
    id: 'join-requests-desk',
    label: 'Join requests',
    routeSegments: ['join-requests'],
    requireAnyOf: [
      'choir.join.review@choir',
      'choir.member.manage@choir',
    ],
    mode: 'any',
  },
  {
    id: 'join-requests-review',
    label: 'Review join requests',
    routeSegments: ['join-requests'],
    requireAnyOf: [
      'choir.join.review@choir',
      'choir.member.manage@choir',
    ],
    mode: 'any',
  },
];

export function uiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const def = JOIN_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
}
