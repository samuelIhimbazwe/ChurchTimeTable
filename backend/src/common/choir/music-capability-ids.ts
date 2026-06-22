/** v1 choir music / rehearsal capabilities — do not extend without review. */
export const CHOIR_MUSIC_CAPABILITY_IDS = [
  'choir.music.view@choir',
  'choir.music.manage@choir',
  'choir.rehearsal.view@choir',
  'choir.rehearsal.manage@choir',
] as const;

export type ChoirMusicCapabilityId =
  (typeof CHOIR_MUSIC_CAPABILITY_IDS)[number];
