/** UI-facing capability IDs — must stay in sync with backend (see admin-hub-capability-contract.spec.ts). */
export type AdminHubUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const ADMIN_HUB_UI_CAPABILITY_REGISTRY: AdminHubUiCapabilityDefinition[] =
  [
    {
      id: 'admin-hub',
      label: 'Choir administration hub',
      routeSegments: ['admin'],
      requireAnyOf: [
        'choir.join.review@choir',
        'choir.member.manage@choir',
        'choir.member.view@choir',
        'choir.ops.manage@choir',
        'choir.ops.view@choir',
        'choir.custom_role.manage@choir',
        'choir.committee_role.manage@choir',
        'choir.contribution.oversight@choir',
      ],
      mode: 'any',
    },
    {
      id: 'admin-join-link',
      label: 'Join requests',
      routeSegments: ['admin'],
      requireAnyOf: [
        'choir.join.review@choir',
        'choir.member.manage@choir',
        'choir.ops.manage@choir',
      ],
      mode: 'any',
    },
    {
      id: 'admin-roster-link',
      label: 'Roster',
      routeSegments: ['admin'],
      requireAnyOf: [
        'choir.member.view@choir',
        'choir.member.manage@choir',
        'choir.ops.view@choir',
      ],
      mode: 'any',
    },
    {
      id: 'admin-families-link',
      label: 'Families structure',
      routeSegments: ['admin'],
      requireAnyOf: [
        'choir.contribution.oversight@choir',
        'choir.contribution.view@family',
        'choir.join.review@choir',
        'choir.member.manage@choir',
      ],
      mode: 'any',
    },
    {
      id: 'admin-roles-link',
      label: 'Position roles',
      routeSegments: ['admin'],
      requireAnyOf: [
        'choir.custom_role.manage@choir',
        'choir.committee_role.manage@choir',
        'choir.member.manage@choir',
      ],
      mode: 'any',
    },
    {
      id: 'admin-public-profile-link',
      label: 'Public profile',
      routeSegments: ['admin'],
      requireAnyOf: [
        'choir.ops.manage@choir',
        'choir.ops.view@choir',
        'choir.member.manage@choir',
      ],
      mode: 'any',
    },
    {
      id: 'admin-settings-link',
      label: 'Choir settings',
      routeSegments: ['admin'],
      requireAnyOf: [
        'choir.ops.manage@choir',
        'choir.ops.view@choir',
        'choir.join.review@choir',
      ],
      mode: 'any',
    },
    {
      id: 'admin-service-requests-link',
      label: 'Church service requests',
      routeSegments: ['admin'],
      requireAnyOf: [
        'choir.join.review@choir',
        'choir.ops.manage@choir',
        'choir.ops.view@choir',
      ],
      mode: 'any',
    },
    {
      id: 'admin-executive-join-card',
      label: 'Executive join decisions',
      routeSegments: ['president', 'vice-president'],
      requireAnyOf: [
        'choir.join.review@choir',
        'choir.member.manage@choir',
      ],
      mode: 'any',
    },
    {
      id: 'admin-executive-roles-link',
      label: 'Executive position roles',
      routeSegments: ['president', 'vice-president'],
      requireAnyOf: [
        'choir.custom_role.manage@choir',
        'choir.committee_role.manage@choir',
      ],
      mode: 'any',
    },
  ];

export function uiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const def = ADMIN_HUB_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
}

export function isAdminHubUiCapability(uiId: string): boolean {
  return ADMIN_HUB_UI_CAPABILITY_REGISTRY.some((d) => d.id === uiId);
}
