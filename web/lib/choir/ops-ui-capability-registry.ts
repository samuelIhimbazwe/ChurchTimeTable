/** UI-facing capability IDs — must stay in sync with backend (see ops-capability-contract.spec.ts). */
export type OpsUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const OPS_UI_CAPABILITY_REGISTRY: OpsUiCapabilityDefinition[] = [
  {
    id: 'ops-scheduling-hub',
    label: 'Scheduling & service prep',
    routeSegments: ['scheduling', 'service-preparation'],
    requireAnyOf: [
      'choir.ops.view@choir',
      'choir.ops.manage@choir',
      'choir.ops.schedule@choir',
    ],
    mode: 'any',
  },
  {
    id: 'ops-schedule-manage',
    label: 'Manage choir schedule',
    routeSegments: ['scheduling'],
    requireAnyOf: ['choir.ops.schedule@choir', 'choir.ops.manage@choir'],
    mode: 'any',
  },
  {
    id: 'ops-activities-hub',
    label: 'Choir activities',
    routeSegments: ['activities'],
    requireAnyOf: ['choir.ops.view@choir', 'choir.ops.manage@choir'],
    mode: 'any',
  },
  {
    id: 'ops-activities-manage',
    label: 'Create choir activities',
    routeSegments: ['activities'],
    requireAnyOf: ['choir.ops.manage@choir'],
    mode: 'any',
  },
  {
    id: 'ops-service-prep-manage',
    label: 'Manage service preparation',
    routeSegments: ['service-preparation'],
    requireAnyOf: ['choir.ops.manage@choir'],
    mode: 'any',
  },
];

export function uiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const def = OPS_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
}

export function isOpsUiCapability(uiId: string): boolean {
  return OPS_UI_CAPABILITY_REGISTRY.some((d) => d.id === uiId);
}
