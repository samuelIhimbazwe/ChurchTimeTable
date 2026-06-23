import * as fs from 'fs';
import * as path from 'path';
import { LEGACY_PERMISSION_ALIASES } from './capability-alias-map';
import { RECORDS_HUB_UI_CAPABILITY_REGISTRY as backendRegistry } from './records-hub-ui-capability-registry';

describe('records hub capability contract', () => {
  it('matches web/lib/choir/records-hub-ui-capability-registry.ts', () => {
    const webPath = path.resolve(
      __dirname,
      '../../../../web/lib/choir/records-hub-ui-capability-registry.ts',
    );
    const webSource = fs.readFileSync(webPath, 'utf8');
    const match = webSource.match(
      /export const RECORDS_HUB_UI_CAPABILITY_REGISTRY[^=]*=\s*(\[[\s\S]*?\];)/,
    );
    expect(match).toBeTruthy();
    const webRegistry = eval(match![1]) as typeof backendRegistry;
    expect(JSON.stringify(webRegistry)).toBe(JSON.stringify(backendRegistry));
  });

  it('aliases choir.records.view to document and ops view', () => {
    expect(LEGACY_PERMISSION_ALIASES['choir.records.view']).toEqual(
      expect.arrayContaining([
        'choir.document.view@choir',
        'choir.ops.view@choir',
      ]),
    );
  });
});
