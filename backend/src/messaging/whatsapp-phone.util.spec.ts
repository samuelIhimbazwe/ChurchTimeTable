import { normalizeWhatsAppPhone } from './whatsapp-phone.util';

describe('normalizeWhatsAppPhone', () => {
  it('normalizes Rwanda local numbers', () => {
    expect(normalizeWhatsAppPhone('0788123456')).toBe('250788123456');
    expect(normalizeWhatsAppPhone('+250788123456')).toBe('250788123456');
  });
});
