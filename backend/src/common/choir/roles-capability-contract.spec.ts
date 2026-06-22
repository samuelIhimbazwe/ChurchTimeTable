import * as fs from 'fs';
import * as path from 'path';
import { ROLES_UI_CAPABILITY_REGISTRY as backendRegistry } from './roles-ui-capability-registry';

describe('roles UI capability registry contract', () => {
  it('matches web/lib/choir/roles-ui-capability-registry.ts', () => {
    const webPath = path.resolve(
      __dirname,
      '../../../../web/lib/choir/roles-ui-capability-registry.ts',
    );
    const webSource = fs.readFileSync(webPath, 'utf8');
    const match = webSource.match(
      /export const ROLES_UI_CAPABILITY_REGISTRY[^=]*=\s*(\[[\s\S]*?\];)/,
    );
    expect(match).toBeTruthy();
    const webRegistry = eval(match![1]) as typeof backendRegistry;
    expect(JSON.stringify(webRegistry)).toBe(JSON.stringify(backendRegistry));
  });
});
