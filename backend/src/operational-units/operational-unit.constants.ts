import { OperationalUnitType } from '@prisma/client';

export const OPERATIONAL_UNIT_AUDIT_ACTIONS = {
  CREATED: 'OPERATIONAL_UNIT_CREATED',
  UPDATED: 'OPERATIONAL_UNIT_UPDATED',
  MEMBER_ADDED: 'OPERATIONAL_UNIT_MEMBER_ADDED',
  MEMBER_REMOVED: 'OPERATIONAL_UNIT_MEMBER_REMOVED',
  LEADERSHIP_ASSIGNED: 'OPERATIONAL_UNIT_LEADERSHIP_ASSIGNED',
  LEADERSHIP_ENDED: 'OPERATIONAL_UNIT_LEADERSHIP_ENDED',
  PERMISSION_GRANTED: 'OPERATIONAL_UNIT_PERMISSION_GRANTED',
  PERMISSION_REVOKED: 'OPERATIONAL_UNIT_PERMISSION_REVOKED',
  SETTINGS_UPDATED: 'OPERATIONAL_UNIT_SETTINGS_UPDATED',
} as const;

export const OPERATIONAL_UNIT_AUDIT_ENTITY = 'OperationalUnit';

export const DEFAULT_LEADERSHIP_POSITIONS = [
  { name: 'President', description: 'Unit president', isSystem: true },
  { name: 'Vice President', description: 'Unit vice president', isSystem: true },
  { name: 'Secretary', description: 'Unit secretary', isSystem: true },
  { name: 'Treasurer', description: 'Unit treasurer', isSystem: true },
  { name: 'Advisor', description: 'Unit advisor', isSystem: true },
] as const;

/** Main Choir and other CHOIR-type units */
export const CHOIR_UNIT_LEADERSHIP_POSITIONS = [
  { name: 'Choir President', description: 'Choir unit president', isSystem: true },
  { name: 'Choir Secretary', description: 'Choir unit secretary', isSystem: true },
  { name: 'Advisor', description: 'Choir advisor', isSystem: true },
] as const;

export type OperationalUnitSeedPosition = {
  name: string;
  description: string;
  isSystem: boolean;
};

export const DEFAULT_OPERATIONAL_UNITS: Array<{
  ministryCode: string;
  code: string;
  name: string;
  description: string;
  type: OperationalUnitType;
  positions?: ReadonlyArray<OperationalUnitSeedPosition>;
}> = [
  {
    ministryCode: 'MUSIC',
    code: 'MAIN_CHOIR',
    name: 'Main Choir',
    description: 'Primary choir operational unit',
    type: 'CHOIR',
    positions: CHOIR_UNIT_LEADERSHIP_POSITIONS,
  },
  {
    ministryCode: 'MUSIC',
    code: 'INDEPENDENT_ARTISTS',
    name: 'Independent Artists',
    description: 'Independent artists group',
    type: 'ARTIST_GROUP',
  },
  {
    ministryCode: 'DEACONS',
    code: 'PROTOCOL_TEAM',
    name: 'Protocol Team',
    description: 'Deacons protocol service team',
    type: 'PROTOCOL_TEAM',
  },
];

export function leadershipPositionsForUnit(
  type: OperationalUnitType,
): ReadonlyArray<OperationalUnitSeedPosition> {
  return type === 'CHOIR' ? CHOIR_UNIT_LEADERSHIP_POSITIONS : DEFAULT_LEADERSHIP_POSITIONS;
}
