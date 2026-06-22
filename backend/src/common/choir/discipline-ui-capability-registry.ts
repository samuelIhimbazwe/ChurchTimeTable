export type DisciplineUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const DISCIPLINE_UI_CAPABILITY_REGISTRY: DisciplineUiCapabilityDefinition[] =
  [
    {
      id: 'discipline-desk',
      label: 'Discipline cases',
      routeSegments: ['discipline'],
      requireAnyOf: [
        'choir.discipline.view@choir',
        'choir.discipline.manage@choir',
        'choir.discipline.review@choir',
      ],
      mode: 'any',
    },
    {
      id: 'discipline-manage',
      label: 'Manage discipline cases',
      routeSegments: ['discipline'],
      requireAnyOf: ['choir.discipline.manage@choir'],
      mode: 'any',
    },
  ];

export function uiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const def = DISCIPLINE_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
}
