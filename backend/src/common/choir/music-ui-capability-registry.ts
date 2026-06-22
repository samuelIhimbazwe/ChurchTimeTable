export type MusicUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const MUSIC_UI_CAPABILITY_REGISTRY: MusicUiCapabilityDefinition[] = [
  {
    id: 'music-library-hub',
    label: 'Music library',
    routeSegments: ['music'],
    requireAnyOf: [
      'choir.music.view@choir',
      'choir.music.manage@choir',
      'choir.rehearsal.view@choir',
    ],
    mode: 'any',
  },
  {
    id: 'music-library-manage',
    label: 'Manage music library',
    routeSegments: ['music'],
    requireAnyOf: ['choir.music.manage@choir'],
    mode: 'any',
  },
  {
    id: 'music-direction-hub',
    label: 'Music direction',
    routeSegments: ['music-direction'],
    requireAnyOf: [
      'choir.music.manage@choir',
      'choir.rehearsal.manage@choir',
      'choir.rehearsal.view@choir',
    ],
    mode: 'any',
  },
  {
    id: 'music-direction-manage',
    label: 'Manage music direction',
    routeSegments: ['music-direction'],
    requireAnyOf: ['choir.music.manage@choir', 'choir.rehearsal.manage@choir'],
    mode: 'any',
  },
];

export function uiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const def = MUSIC_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
}
