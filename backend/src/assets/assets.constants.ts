export const ASSET_AUDIT_ENTITY = 'Asset';

export const ASSET_AUDIT_ACTIONS = {
  CREATED: 'ASSET_CREATED',
  UPDATED: 'ASSET_UPDATED',
  ASSIGNED: 'ASSET_ASSIGNED',
  RETURNED: 'ASSET_RETURNED',
  TRANSFERRED: 'ASSET_TRANSFERRED',
  OWNER_ADDED: 'ASSET_OWNER_ADDED',
  OWNER_REMOVED: 'ASSET_OWNER_REMOVED',
  CUSTODIAN_ASSIGNED: 'ASSET_CUSTODIAN_ASSIGNED',
  MAINTENANCE_RECORDED: 'ASSET_MAINTENANCE_RECORDED',
  LOST: 'ASSET_LOST',
  FOUND: 'ASSET_FOUND',
  RETIRED: 'ASSET_RETIRED',
} as const;

export const SYSTEM_ASSET_CATEGORIES = [
  { code: 'AUDIO', name: 'Audio', description: 'Sound systems and audio gear' },
  { code: 'MUSICAL_INSTRUMENT', name: 'Musical Instrument', description: 'Instruments' },
  { code: 'UNIFORM', name: 'Uniform', description: 'Robes, protocol attire, badges' },
  { code: 'IT', name: 'IT', description: 'Computers and networking' },
  { code: 'VEHICLE', name: 'Vehicle', description: 'Church vehicles' },
  { code: 'FURNITURE', name: 'Furniture', description: 'Furniture and fixtures' },
  { code: 'FACILITY', name: 'Facility', description: 'Facility-related assets' },
  { code: 'MEDIA', name: 'Media', description: 'Cameras and media equipment' },
  { code: 'OTHER', name: 'Other', description: 'General assets' },
] as const;

export const CHURCH_OWNER_ID = 'CHURCH';
