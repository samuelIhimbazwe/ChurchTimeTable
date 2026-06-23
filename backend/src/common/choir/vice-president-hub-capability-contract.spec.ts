import * as fs from 'fs';
import * as path from 'path';
import { LEGACY_PERMISSION_ALIASES } from './capability-alias-map';
import { VICE_PRESIDENT_HUB_UI_CAPABILITY_REGISTRY as backendRegistry } from './vice-president-hub-ui-capability-registry';

describe('vice president hub capability contract', () => {
  it('matches web/lib/choir/vice-president-hub-ui-capability-registry.ts', () => {
    const webPath = path.resolve(
      __dirname,
      '../../../../web/lib/choir/vice-president-hub-ui-capability-registry.ts',
    );
    const webSource = fs.readFileSync(webPath, 'utf8');
    const match = webSource.match(
      /export const VICE_PRESIDENT_HUB_UI_CAPABILITY_REGISTRY[^=]*=\s*(\[[\s\S]*?\];)/,
    );
    expect(match).toBeTruthy();
    const webRegistry = eval(match![1]) as typeof backendRegistry;
    expect(JSON.stringify(webRegistry)).toBe(JSON.stringify(backendRegistry));
  });

  it('aliases vice president legacy permissions to scoped capabilities', () => {
    expect(LEGACY_PERMISSION_ALIASES['choir.ops.view']).toEqual(
      expect.arrayContaining(['choir.ops.view@choir']),
    );
    expect(LEGACY_PERMISSION_ALIASES['choir.ops.manage']).toEqual(
      expect.arrayContaining(['choir.ops.manage@choir']),
    );
    expect(LEGACY_PERMISSION_ALIASES['event:write']).toEqual([
      'choir.ops.manage@choir',
    ]);
  });
});
