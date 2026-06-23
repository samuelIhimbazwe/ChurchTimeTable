export type PlatformDomain = 'protocol' | 'church' | 'platform';

export type MappedPlatformCapability = {
  id: string;
  domain: PlatformDomain;
};

/** Map a legacy permission code to scoped platform capability id(s). */
export function mapPermissionToPlatformCapabilities(
  permission: string,
): MappedPlatformCapability[] {
  if (permission === 'admin.settings.*') {
    return [{ id: 'admin.settings.manage@platform', domain: 'platform' }];
  }
  if (permission.startsWith('admin.') || permission.startsWith('pilot.')) {
    return [{ id: `${permission}@platform`, domain: 'platform' }];
  }
  if (permission.startsWith('protocol.')) {
    return [{ id: `${permission}@ministry`, domain: 'protocol' }];
  }
  if (permission.startsWith('church.')) {
    return [{ id: `${permission}@church`, domain: 'church' }];
  }
  if (permission.startsWith('ministry.')) {
    return [{ id: `church.${permission}@church`, domain: 'church' }];
  }
  if (permission.startsWith('committee.')) {
    return [{ id: `protocol.${permission}@ministry`, domain: 'protocol' }];
  }
  if (permission.startsWith('choir.')) {
    return [{ id: `church.${permission}@church`, domain: 'church' }];
  }

  const legacy: Record<string, MappedPlatformCapability> = {
    'member:manage': { id: 'church.member.manage@church', domain: 'church' },
    'report:export': { id: 'church.report.export@church', domain: 'church' },
    'operations:manage': { id: 'church.operations.manage@church', domain: 'church' },
    'attendance.mark': { id: 'protocol.attendance.mark@ministry', domain: 'protocol' },
    'attendance:write': { id: 'protocol.attendance.mark@ministry', domain: 'protocol' },
    'member:read': { id: 'protocol.view@ministry', domain: 'protocol' },
    'member.portal.view': { id: 'protocol.view@ministry', domain: 'protocol' },
  };

  const mapped = legacy[permission];
  return mapped ? [mapped] : [];
}
