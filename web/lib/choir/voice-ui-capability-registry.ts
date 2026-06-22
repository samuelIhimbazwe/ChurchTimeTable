/** UI-facing capability IDs — must stay in sync with backend (see voice-capability-contract.spec.ts). */
export type VoiceUiCapabilityDefinition = {
  id: string;
  label: string;
  routeSegments: string[];
  requireAnyOf: readonly string[];
  mode: 'any' | 'all';
};

export const VOICE_UI_CAPABILITY_REGISTRY: VoiceUiCapabilityDefinition[] = [
  {
    id: 'voice-sections-hub',
    label: 'Voice sections',
    routeSegments: ['voice-sections'],
    requireAnyOf: ['choir.voice.view@choir'],
    mode: 'any',
  },
];

export function uiCapabilityVisible(
  uiId: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const def = VOICE_UI_CAPABILITY_REGISTRY.find((d) => d.id === uiId);
  if (!def) return false;
  if (def.mode === 'all') {
    return def.requireAnyOf.every((cap) => check(cap));
  }
  return def.requireAnyOf.some((cap) => check(cap));
}

export function isVoiceUiCapability(uiId: string): boolean {
  return VOICE_UI_CAPABILITY_REGISTRY.some((d) => d.id === uiId);
}
