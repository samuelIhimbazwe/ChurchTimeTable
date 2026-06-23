export type DevotionUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const DEVOTION_UI_CAPABILITY_REGISTRY: DevotionUiCapabilityDefinition[] =
  [
    {
      id: 'devotion-spiritual-content',
      label: 'Spiritual devotions content',
      routeSegments: ['spiritual'],
      requireAnyOf: [
        'choir.devotion.view@choir',
        'choir.devotion.create@choir',
        'choir.devotion.publish@choir',
        'choir.devotion.manage@choir',
      ],
      mode: 'any',
    },
    {
      id: 'devotion-publish-form',
      label: 'Publish devotions',
      routeSegments: ['spiritual'],
      requireAnyOf: [
        'choir.devotion.create@choir',
        'choir.devotion.publish@choir',
        'choir.devotion.manage@choir',
      ],
      mode: 'any',
    },
    {
      id: 'devotion-manage',
      label: 'Manage devotions',
      routeSegments: ['spiritual'],
      requireAnyOf: ['choir.devotion.manage@choir'],
      mode: 'any',
    },
    {
      id: 'devotion-intercession-actions',
      label: 'Intercession inbox actions',
      routeSegments: ['spiritual'],
      requireAnyOf: ['choir.devotion.manage@choir'],
      mode: 'any',
    },
    {
      id: 'devotion-prayer-programs',
      label: 'Prayer & fasting programs',
      routeSegments: ['spiritual'],
      requireAnyOf: [
        'choir.devotion.publish@choir',
        'choir.devotion.manage@choir',
      ],
      mode: 'any',
    },
  ];

export function uiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const def = DEVOTION_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
}
