import { mapPermissionToPlatformCapabilities } from './platform-capability.util';
import { mapPermissionToPlatformCapabilities as webMap } from '../../../../web/lib/platform/platform-capability.util';

describe('platform capability util', () => {
  it('maps protocol permissions to @ministry scope', () => {
    expect(mapPermissionToPlatformCapabilities('protocol.team.manage')).toEqual([
      { id: 'protocol.team.manage@ministry', domain: 'protocol' },
    ]);
  });

  it('maps church permissions to @church scope', () => {
    expect(mapPermissionToPlatformCapabilities('church.schedule.submit')).toEqual([
      { id: 'church.schedule.submit@church', domain: 'church' },
    ]);
  });

  it('maps admin permissions to @platform scope', () => {
    expect(mapPermissionToPlatformCapabilities('admin.users.manage')).toEqual([
      { id: 'admin.users.manage@platform', domain: 'platform' },
    ]);
  });

  it('maps legacy member:manage to church domain', () => {
    expect(mapPermissionToPlatformCapabilities('member:manage')).toEqual([
      { id: 'church.member.manage@church', domain: 'church' },
    ]);
  });

  it('matches web util mapping', () => {
    const samples = [
      'protocol.manage',
      'church.governance.manage',
      'pilot.import.manage',
      'committee.member.manage',
      'choir.ops.manage',
      'report:export',
    ];
    for (const perm of samples) {
      expect(mapPermissionToPlatformCapabilities(perm)).toEqual(webMap(perm));
    }
  });
});
