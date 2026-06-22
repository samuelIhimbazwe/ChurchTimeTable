/** v1 choir voice-section capabilities — do not extend without review. */
export const CHOIR_VOICE_CAPABILITY_IDS = [
  'choir.voice.view@choir',
] as const;

export type ChoirVoiceCapabilityId =
  (typeof CHOIR_VOICE_CAPABILITY_IDS)[number];
