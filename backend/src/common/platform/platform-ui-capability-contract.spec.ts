import * as fs from 'fs';
import * as path from 'path';
import { PLATFORM_UI_CAPABILITY_REGISTRY as backendRegistry } from './platform-ui-capability-registry';

describe('platform UI capability registry contract', () => {
  it('matches web/lib/platform/platform-ui-capability-registry.ts', () => {
    const webPath = path.resolve(
      __dirname,
      '../../../../web/lib/platform/platform-ui-capability-registry.ts',
    );
    const webSource = fs.readFileSync(webPath, 'utf8');
    const match = webSource.match(
      /export const PLATFORM_UI_CAPABILITY_REGISTRY[^=]*=\s*(\[[\s\S]*?\n\])/,
    );
    expect(match).toBeTruthy();
    const webRegistry = eval(match![1]) as typeof backendRegistry;
    expect(JSON.stringify(webRegistry)).toBe(JSON.stringify(backendRegistry));
  });
});
