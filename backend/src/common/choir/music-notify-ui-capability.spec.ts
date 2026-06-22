import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { buildCapabilityRouterFromAuths } from '../../../../web/lib/choir/capability-router';
import { uiCapabilityVisible } from '../../../../web/lib/choir/music-ui-capability-registry';

const musicDirectorAuths = {
  musicAuth: {
    userId: 'md',
    choirId: 'c1',
    capabilities: [{ id: 'choir.music.manage@choir' }],
  } satisfies ResolvedAuth,
};

const commsOfficerAuths = {
  commsAuth: {
    userId: 'comms',
    choirId: 'c1',
    capabilities: [{ id: 'choir.announcement.manage@choir' }],
  } satisfies ResolvedAuth,
};

const memberAuths = {
  musicAuth: {
    userId: 'mem',
    choirId: 'c1',
    capabilities: [{ id: 'choir.music.view@choir' }],
  } satisfies ResolvedAuth,
};

describe('music-notify-members UI capability', () => {
  it('music director can notify members', () => {
    const check = buildCapabilityRouterFromAuths(musicDirectorAuths);
    expect(uiCapabilityVisible('music-notify-members', check)).toBe(true);
  });

  it('announcement manager can notify members', () => {
    const check = buildCapabilityRouterFromAuths(commsOfficerAuths);
    expect(uiCapabilityVisible('music-notify-members', check)).toBe(true);
  });

  it('view-only music access cannot notify members', () => {
    const check = buildCapabilityRouterFromAuths(memberAuths);
    expect(uiCapabilityVisible('music-notify-members', check)).toBe(false);
  });
});
