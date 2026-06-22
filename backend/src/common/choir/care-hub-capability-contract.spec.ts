import * as fs from 'fs';
import * as path from 'path';
import { LEGACY_PERMISSION_ALIASES } from './capability-alias-map';
import { CARE_HUB_UI_CAPABILITY_REGISTRY as backendRegistry } from './care-hub-ui-capability-registry';

describe('care hub capability contract', () => {
  it('matches web/lib/choir/care-hub-ui-capability-registry.ts', () => {
    const webPath = path.resolve(
      __dirname,
      '../../../../web/lib/choir/care-hub-ui-capability-registry.ts',
    );
    const webSource = fs.readFileSync(webPath, 'utf8');
    const match = webSource.match(
      /export const CARE_HUB_UI_CAPABILITY_REGISTRY[^=]*=\s*(\[[\s\S]*?\];)/,
    );
    expect(match).toBeTruthy();
    const webRegistry = eval(match![1]) as typeof backendRegistry;
    expect(JSON.stringify(webRegistry)).toBe(JSON.stringify(backendRegistry));
  });

  it('aliases care legacy permissions', () => {
    expect(LEGACY_PERMISSION_ALIASES['choir.rules.manage']).toEqual(
      expect.arrayContaining(['choir.document.manage@choir']),
    );
    expect(LEGACY_PERMISSION_ALIASES['choir.member.notify']).toEqual([
      'choir.announcement.manage@choir',
    ]);
  });
});
