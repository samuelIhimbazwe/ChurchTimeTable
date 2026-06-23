import * as fs from 'fs';
import * as path from 'path';
import { LEGACY_PERMISSION_ALIASES } from './capability-alias-map';
import { ADVISOR_HUB_UI_CAPABILITY_REGISTRY as backendRegistry } from './advisor-hub-ui-capability-registry';

describe('advisor hub capability contract', () => {
  it('matches web/lib/choir/advisor-hub-ui-capability-registry.ts', () => {
    const webPath = path.resolve(
      __dirname,
      '../../../../web/lib/choir/advisor-hub-ui-capability-registry.ts',
    );
    const webSource = fs.readFileSync(webPath, 'utf8');
    const match = webSource.match(
      /export const ADVISOR_HUB_UI_CAPABILITY_REGISTRY[^=]*=\s*(\[[\s\S]*?\];)/,
    );
    expect(match).toBeTruthy();
    const webRegistry = eval(match![1]) as typeof backendRegistry;
    expect(JSON.stringify(webRegistry)).toBe(JSON.stringify(backendRegistry));
  });

  it('aliases advisor legacy permissions to scoped capabilities', () => {
    expect(LEGACY_PERMISSION_ALIASES['choir.reports.view']).toEqual([
      'choir.ops.view@choir',
    ]);
    expect(LEGACY_PERMISSION_ALIASES['discipline:read_all']).toEqual([
      'choir.discipline.view@choir',
    ]);
    expect(LEGACY_PERMISSION_ALIASES['event:read']).toEqual(
      expect.arrayContaining(['choir.ops.view@choir']),
    );
  });
});
