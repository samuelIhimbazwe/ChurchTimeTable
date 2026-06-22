/** UI-facing capability IDs — must stay in sync with backend (see roles-capability-contract.spec.ts). */
export type RolesUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const ROLES_UI_CAPABILITY_REGISTRY: RolesUiCapabilityDefinition[] = [
  {
    id: 'roles-hub',
    label: 'Position roles',
    routeSegments: ['roles'],
    requireAnyOf: [
      'choir.custom_role.manage@choir',
      'choir.committee_role.manage@choir',
    ],
    mode: 'any',
  },
  {
    id: 'roles-custom-manage',
    label: 'Manage custom roles',
    routeSegments: ['roles'],
    requireAnyOf: ['choir.custom_role.manage@choir'],
    mode: 'any',
  },
  {
    id: 'roles-committee-manage',
    label: 'Manage committee roles',
    routeSegments: ['roles'],
    requireAnyOf: ['choir.committee_role.manage@choir'],
    mode: 'any',
  },
  {
    id: 'roles-committee-assign',
    label: 'Assign committee seats',
    routeSegments: ['members', 'join-requests'],
    requireAnyOf: [
      'choir.committee_member.manage@choir',
      'choir.member.manage@choir',
    ],
    mode: 'any',
  },
];

export function uiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const def = ROLES_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
}

export function isRolesUiCapability(uiId: string): boolean {
  return ROLES_UI_CAPABILITY_REGISTRY.some((d) => d.id === uiId);
}
