import * as fs from 'fs';
import * as path from 'path';
import { OPS_UI_CAPABILITY_REGISTRY as backendRegistry } from './ops-ui-capability-registry';

describe('ops UI capability registry contract', () => {
  it('matches web/lib/choir/ops-ui-capability-registry.ts', () => {
    const webPath = path.resolve(
      __dirname,
      '../../../../web/lib/choir/ops-ui-capability-registry.ts',
    );
    const webSource = fs.readFileSync(webPath, 'utf8');
    const match = webSource.match(
      /export const OPS_UI_CAPABILITY_REGISTRY[^=]*=\s*(\[[\s\S]*?\];)/,
    );
    expect(match).toBeTruthy();
    const webRegistry = eval(match![1]) as typeof backendRegistry;
    expect(JSON.stringify(webRegistry)).toBe(JSON.stringify(backendRegistry));
  });
});
