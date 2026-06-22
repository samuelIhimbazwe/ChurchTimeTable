import { ROLES } from '../constants/roles';

const MUSIC_VIEW = 'choir.music.view@choir' as const;
const MUSIC_MANAGE = 'choir.music.manage@choir' as const;
const REHEARSAL_VIEW = 'choir.rehearsal.view@choir' as const;
const REHEARSAL_MANAGE = 'choir.rehearsal.manage@choir' as const;

const FULL_MUSIC = [
  MUSIC_VIEW,
  MUSIC_MANAGE,
  REHEARSAL_VIEW,
  REHEARSAL_MANAGE,
] as const;

/** CMMS role name → choir-scoped music / rehearsal capabilities. */
export const ROLE_MUSIC_CAPABILITY_BUNDLES: Record<
  string,
  readonly string[]
> = {
  [ROLES.MEMBER]: [MUSIC_VIEW, REHEARSAL_VIEW],
  [ROLES.CHOIR_REHEARSAL_DIRECTOR]: [...FULL_MUSIC],
  [ROLES.CHOIR_ADMIN]: [...FULL_MUSIC],
  [ROLES.CHOIR_PRESIDENT]: [...FULL_MUSIC],
  [ROLES.CHOIR_VICE_PRESIDENT]: [...FULL_MUSIC],
  [ROLES.CHOIR_LEADER]: [...FULL_MUSIC],
};
