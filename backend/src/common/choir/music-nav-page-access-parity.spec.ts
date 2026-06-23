import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { buildCapabilityRouterFromAuths } from '../../../../web/lib/choir/capability-router';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  legacyMusicDirectionHubLinkVisible,
  LEGACY_MUSIC_DIRECTION_HUB_PATH,
  musicNavItemVisible,
  musicNavItemVisibleWithCheck,
  pageAccessForMusicRoute,
  pageAccessForMusicRouteWithCheck,
} from '../../../../web/lib/navigation/music-nav';
import { getChoirNavForUser } from '../../../../web/lib/navigation/role-nav';

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

  it('legacy and scoped music direction paths use same gate via capability router', () => {
    const auths = { musicAuth: directorAuth };
    const check = buildCapabilityRouterFromAuths(auths);
    expect(musicNavItemVisibleWithCheck(LEGACY_MUSIC_DIRECTION_HUB_PATH, check)).toBe(
      pageAccessForMusicRouteWithCheck(LEGACY_MUSIC_DIRECTION_HUB_PATH, check),
    );
    const scoped = choirPath(PILOT_CHOIR, 'music-direction');
    expect(musicNavItemVisibleWithCheck(scoped, check)).toBe(
      pageAccessForMusicRouteWithCheck(scoped, check),
    );
  });

  it('music director sees legacy hub link via capability router', () => {
    const check = buildCapabilityRouterFromAuths({ musicAuth: directorAuth });
    expect(legacyMusicDirectionHubLinkVisible([], check)).toBe(true);
  });

  it('member without caps falls back to legacy permissions only', () => {
    expect(legacyMusicDirectionHubLinkVisible(['choir.music.manage'])).toBe(true);
    expect(legacyMusicDirectionHubLinkVisible(['choir.rehearsal.manage'])).toBe(true);
    expect(legacyMusicDirectionHubLinkVisible([])).toBe(false);
  });

  it('getChoirNavForUser includes music direction hub when capability router grants access', () => {
    const check = buildCapabilityRouterFromAuths({ musicAuth: directorAuth });
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    expect(
      roleSection?.items.some((i) => i.path === LEGACY_MUSIC_DIRECTION_HUB_PATH),
    ).toBe(true);
  });

  it('getChoirNavForUser omits music direction hub without caps or legacy permissions', () => {
    const check = buildCapabilityRouterFromAuths({ musicAuth: noCapsAuth });
    const sections = getChoirNavForUser(
      'MEMBER',
      { canAccessChoirArea: true, isChoirMember: true },
      [],
      check,
    );
    const roleSection = sections.find((s) => s.section === 'My choir role');
    const hasMusicLink =
      roleSection?.items.some((i) => i.path === LEGACY_MUSIC_DIRECTION_HUB_PATH) ?? false;
    expect(hasMusicLink).toBe(false);
  });
});
