import { can } from './capability-can.util';
import type { ResolvedAuth } from './capability.types';

describe('voice capability-can', () => {
  const voiceAuth: ResolvedAuth = {
    userId: 'u1',
    choirId: 'c1',
    capabilities: [{ id: 'choir.voice.view@choir' }],
  };

  const noCapsAuth: ResolvedAuth = {
    userId: 'u2',
    choirId: 'c1',
    capabilities: [],
  };

  it('voice view capability is granted', () => {
    expect(can(voiceAuth, 'choir.voice.view@choir')).toBe(true);
  });

  it('user without voice caps cannot view', () => {
    expect(can(noCapsAuth, 'choir.voice.view@choir')).toBe(false);
  });
});
