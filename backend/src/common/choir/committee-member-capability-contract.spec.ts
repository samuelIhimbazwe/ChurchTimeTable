import * as fs from 'fs';
import * as path from 'path';
import { LEGACY_PERMISSION_ALIASES } from './capability-alias-map';
import { CHOIR_ROLES_CAPABILITY_IDS } from './roles-capability-ids';
import { ROLE_ROLES_CAPABILITY_BUNDLES } from './role-roles-capability-bundles';
import { ROLES_UI_CAPABILITY_REGISTRY } from './roles-ui-capability-registry';

describe('committee member capability contract', () => {
  it('defines choir.committee_member.manage@choir', () => {
    expect(CHOIR_ROLES_CAPABILITY_IDS).toContain(
      'choir.committee_member.manage@choir',
    );
  });

  it('aliases committee.member.manage to choir capability', () => {
    expect(LEGACY_PERMISSION_ALIASES['committee.member.manage']).toEqual([
      'choir.committee_member.manage@choir',
    ]);
  });

  it('president bundle includes committee member manage', () => {
    const presidentBundle = Object.values(ROLE_ROLES_CAPABILITY_BUNDLES).find(
      (bundle) => bundle.includes('choir.committee_member.manage@choir'),
    );
    expect(presidentBundle).toBeTruthy();
  });

  it('roles-committee-assign UI cap accepts member or committee seat manage', () => {
    const def = ROLES_UI_CAPABILITY_REGISTRY.find(
      (d) => d.id === 'roles-committee-assign',
    );
    expect(def?.requireAnyOf).toEqual(
      expect.arrayContaining([
        'choir.committee_member.manage@choir',
        'choir.member.manage@choir',
      ]),
    );
  });

  it('web roster-manage registry includes committee member manage', () => {
    const webPath = path.resolve(
      __dirname,
      '../../../../web/lib/choir/roster-ui-capability-registry.ts',
    );
    const webSource = fs.readFileSync(webPath, 'utf8');
    expect(webSource).toContain('choir.committee_member.manage@choir');
  });
});
