import type { ResolvedAuth } from '../../../../web/lib/choir/capability.types';
import { choirPath } from '../../../../web/lib/choir/paths';
import {
  voiceNavItemVisible,
  pageAccessForVoiceRoute,
} from '../../../../web/lib/navigation/voice-nav';

const PILOT_CHOIR = '00000000-0000-0000-0000-000000000001';

const voiceAuth: ResolvedAuth = {
  userId: 'dir',
  choirId: PILOT_CHOIR,
  capabilities: [{ id: 'choir.voice.view@choir' }],
};

const noCapsAuth: ResolvedAuth = {
  userId: 'none',
  choirId: PILOT_CHOIR,
  capabilities: [],
};

describe('voice nav ↔ page access parity', () => {
  for (const persona of [
    { label: 'Voice view', auth: voiceAuth },
    { label: 'No caps', auth: noCapsAuth },
  ]) {
    describe(persona.label, () => {
      it('voice-sections: nav visibility matches page access', () => {
        const path = choirPath(PILOT_CHOIR, 'voice-sections');
        expect(voiceNavItemVisible(path, persona.auth)).toBe(
          pageAccessForVoiceRoute(path, persona.auth),
        );
      });
    });
  }

  it('user with voice view can access voice-sections route', () => {
    expect(
      pageAccessForVoiceRoute(choirPath(PILOT_CHOIR, 'voice-sections'), voiceAuth),
    ).toBe(true);
  });

  it('user without caps cannot access voice-sections route', () => {
    expect(
      pageAccessForVoiceRoute(choirPath(PILOT_CHOIR, 'voice-sections'), noCapsAuth),
    ).toBe(false);
  });
});
