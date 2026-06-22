import { ROLES } from '../constants/roles';

const VIEW = 'choir.voice.view@choir' as const;

/** CMMS role name → choir-scoped voice section capabilities. */
export const ROLE_VOICE_CAPABILITY_BUNDLES: Record<
  string,
  readonly string[]
> = {
  [ROLES.MEMBER]: [VIEW],
  [ROLES.CHOIR_ADMIN]: [VIEW],
  [ROLES.CHOIR_PRESIDENT]: [VIEW],
  [ROLES.CHOIR_VICE_PRESIDENT]: [VIEW],
  [ROLES.CHOIR_LEADER]: [VIEW],
  [ROLES.CHOIR_SECRETARY]: [VIEW],
  [ROLES.CHOIR_REHEARSAL_DIRECTOR]: [VIEW],
  [ROLES.CHOIR_LOGISTICS]: [VIEW],
  [ROLES.CHOIR_COMMITTEE]: [VIEW],
};
