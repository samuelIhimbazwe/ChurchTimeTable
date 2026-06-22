import { ROLES } from '../constants/roles';

const ANN_VIEW = 'choir.announcement.view@choir' as const;
const ANN_MANAGE = 'choir.announcement.manage@choir' as const;
const MTG_VIEW = 'choir.meeting.view@choir' as const;
const MTG_MANAGE = 'choir.meeting.manage@choir' as const;

const FULL_COMMS = [ANN_VIEW, ANN_MANAGE, MTG_VIEW, MTG_MANAGE] as const;

/** CMMS role name → choir-scoped comms capabilities. */
export const ROLE_COMMS_CAPABILITY_BUNDLES: Record<
  string,
  readonly string[]
> = {
  [ROLES.CHOIR_ADMIN]: [...FULL_COMMS],
  [ROLES.CHOIR_PRESIDENT]: [...FULL_COMMS],
  [ROLES.CHOIR_VICE_PRESIDENT]: [ANN_VIEW, ANN_MANAGE, MTG_VIEW],
  [ROLES.CHOIR_LEADER]: [...FULL_COMMS],
  [ROLES.CHOIR_SECRETARY]: [ANN_VIEW, ANN_MANAGE, MTG_VIEW, MTG_MANAGE],
  [ROLES.CHOIR_REHEARSAL_DIRECTOR]: [ANN_VIEW, ANN_MANAGE],
  [ROLES.CHOIR_LOGISTICS]: [ANN_VIEW],
  [ROLES.CHOIR_COMMITTEE]: [ANN_VIEW, MTG_VIEW],
};
