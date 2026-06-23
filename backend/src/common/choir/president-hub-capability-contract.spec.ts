import * as fs from 'fs';
import * as path from 'path';
import { LEGACY_PERMISSION_ALIASES } from './capability-alias-map';
import { PRESIDENT_HUB_UI_CAPABILITY_REGISTRY as backendRegistry } from './president-hub-ui-capability-registry';

describe('president hub capability contract', () => {
  it('matches web/lib/choir/president-hub-ui-capability-registry.ts', () => {
    const webPath = path.resolve(
      __dirname,
      '../../../../web/lib/choir/president-hub-ui-capability-registry.ts',
    );
    const webSource = fs.readFileSync(webPath, 'utf8');
    const match = webSource.match(
      /export const PRESIDENT_HUB_UI_CAPABILITY_REGISTRY[^=]*=\s*(\[[\s\S]*?\];)/,
    );
    expect(match).toBeTruthy();
    const webRegistry = eval(match![1]) as typeof backendRegistry;
    expect(JSON.stringify(webRegistry)).toBe(JSON.stringify(backendRegistry));
  });

  it('aliases president legacy permissions to scoped capabilities', () => {
    expect(LEGACY_PERMISSION_ALIASES['choir.join.review']).toEqual([
      'choir.join.review@choir',
    ]);
    expect(LEGACY_PERMISSION_ALIASES['member:manage']).toEqual([
      'choir.member.manage@choir',
    ]);
    expect(LEGACY_PERMISSION_ALIASES['choir.oversight']).toEqual(
      expect.arrayContaining(['choir.ops.view@choir']),
    );
    expect(LEGACY_PERMISSION_ALIASES['choir.operations.manage']).toEqual(
      expect.arrayContaining(['choir.ops.manage@choir']),
    );
  });
});
