import * as fs from 'fs';
import * as path from 'path';
import { CONTRIBUTION_UI_CAPABILITY_REGISTRY as backendRegistry } from './contribution-ui-capability-registry';

describe('contribution UI capability registry contract', () => {
  it('matches web/lib/choir/contribution-ui-capability-registry.ts', () => {
    const webPath = path.resolve(
      __dirname,
      '../../../../web/lib/choir/contribution-ui-capability-registry.ts',
    );
    const webSource = fs.readFileSync(webPath, 'utf8');
    const match = webSource.match(
      /export const CONTRIBUTION_UI_CAPABILITY_REGISTRY[^=]*=\s*(\[[\s\S]*?\n\])/,
    );
    expect(match).toBeTruthy();
    const webRegistry = eval(match![1]) as typeof backendRegistry;
    expect(JSON.stringify(webRegistry)).toBe(JSON.stringify(backendRegistry));
  });
});
