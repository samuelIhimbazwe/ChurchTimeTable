import {
  hasEffectivePermission,
  hasOperationalLeaderDashboard,
  hasProtocolCoordination,
  hasProtocolOversight,
  hasProtocolTeamHeadAuthority,
} from './governance-permissions.util';
import { PERMISSIONS } from '../constants/roles';

describe('governance-permissions.util', () => {
  it('resolves direct and committee-scoped claims', () => {
    expect(
      hasEffectivePermission(
        ['committee:protocol-ministry:protocol.oversight'],
        PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,
      ),
    ).toBe(true);
    expect(hasEffectivePermission(['event:read'], 'protocol.oversight')).toBe(
      false,
    );
  });

  it('detects protocol hierarchy capabilities', () => {
    expect(
      hasProtocolOversight([PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE]),
    ).toBe(true);
    expect(
      hasProtocolCoordination([PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE]),
    ).toBe(true);
    expect(hasProtocolTeamHeadAuthority([PERMISSIONS.PROTOCOL_TEAM_HEAD])).toBe(
      true,
    );
  });

  it('does not treat report:export as protocol oversight alone', () => {
    expect(hasProtocolOversight([PERMISSIONS.REPORT_EXPORT])).toBe(false);
    expect(
      hasOperationalLeaderDashboard([PERMISSIONS.REPORT_EXPORT]),
    ).toBe(true);
  });
});
