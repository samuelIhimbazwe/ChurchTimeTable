/** UI-facing capability IDs — must stay in sync with backend (see comms-capability-contract.spec.ts). */
export type CommsUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const COMMS_UI_CAPABILITY_REGISTRY: CommsUiCapabilityDefinition[] = [
  {
    id: 'comms-announcements-hub',
    label: 'Choir announcements',
    routeSegments: ['announcements'],
    requireAnyOf: [
      'choir.announcement.view@choir',
      'choir.announcement.manage@choir',
    ],
    mode: 'any',
  },
  {
    id: 'comms-announcements-manage',
    label: 'Manage choir announcements',
    routeSegments: ['announcements'],
    requireAnyOf: ['choir.announcement.manage@choir'],
    mode: 'any',
  },
  {
    id: 'comms-meetings-hub',
    label: 'Choir meetings',
    routeSegments: ['meetings'],
    requireAnyOf: [
      'choir.meeting.view@choir',
      'choir.meeting.manage@choir',
    ],
    mode: 'any',
  },
  {
    id: 'comms-meetings-manage',
    label: 'Manage choir meetings',
    routeSegments: ['meetings'],
    requireAnyOf: ['choir.meeting.manage@choir'],
    mode: 'any',
  },
];

export function uiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const def = COMMS_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
}

export function isCommsUiCapability(uiId: string): boolean {
  return COMMS_UI_CAPABILITY_REGISTRY.some((d) => d.id === uiId);
}
