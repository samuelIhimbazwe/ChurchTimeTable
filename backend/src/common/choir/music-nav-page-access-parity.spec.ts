import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  musicNavItemVisible,
  pageAccessForMusicRoute,
} from '../../../../web/lib/navigation/music-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const directorAuth: ResolvedAuth = {
  userId: 'dir',
  choirId: PILOT_CHOIR,
  capabilities: [
    { id: 'choir.music.manage@choir' },
    { id: 'choir.rehearsal.manage@choir' },
  ],
};

const memberAuth: ResolvedAuth = {
  userId: 'mem',
  choirId: PILOT_CHOIR,
  capabilities: [
    { id: 'choir.music.view@choir' },
    { id: 'choir.rehearsal.view@choir' },
  ],
};

const noCapsAuth: ResolvedAuth = {
  userId: 'none',
  choirId: PILOT_CHOIR,
  capabilities: [],
};

function routePath(tail: string): string {
  return choirPath(PILOT_CHOIR, tail);
}

describe('music nav ↔ page access parity', () => {
  for (const persona of [
    { label: 'Director', auth: directorAuth },
    { label: 'Member (view)', auth: memberAuth },
    { label: 'No caps', auth: noCapsAuth },
  ]) {
    describe(persona.label, () => {
      it('music library: nav visibility matches page access', () => {
        const path = routePath('music');
        expect(musicNavItemVisible(path, persona.auth)).toBe(
          pageAccessForMusicRoute(path, persona.auth),
        );
      });

      it('music direction: nav visibility matches page access', () => {
        const path = routePath('music-direction');
        expect(musicNavItemVisible(path, persona.auth)).toBe(
          pageAccessForMusicRoute(path, persona.auth),
        );
      });
    });
  }

  it('member with view can access music library', () => {
    expect(pageAccessForMusicRoute(routePath('music'), memberAuth)).toBe(true);
  });

  it('member with view can access music direction hub', () => {
    expect(pageAccessForMusicRoute(routePath('music-direction'), memberAuth)).toBe(
      true,
    );
  });

  it('user without caps cannot access music routes', () => {
    expect(pageAccessForMusicRoute(routePath('music'), noCapsAuth)).toBe(false);
    expect(pageAccessForMusicRoute(routePath('music-direction'), noCapsAuth)).toBe(
      false,
    );
  });
});
