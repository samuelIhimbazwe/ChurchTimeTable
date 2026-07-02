import { I18nService } from './i18n.service';

describe('I18nService', () => {
  const service = new I18nService();

  it('defaults to English when header missing', () => {
    expect(service.resolveLocale()).toBe('en');
  });

  it('resolves en and fr', () => {
    expect(service.resolveLocale('en-US')).toBe('en');
    expect(service.resolveLocale('fr-FR')).toBe('fr');
  });

  it('maps legacy rw to English', () => {
    expect(service.resolveLocale('rw-RW')).toBe('en');
  });

  it('translates schedule conflict messageKey in English', () => {
    const msg = service.translate('en', 'SCHEDULE_OVERLAP');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('has core keys in en and fr catalogs', () => {
    for (const locale of ['en', 'fr'] as const) {
      expect(service.translate(locale, 'SCHEDULE_OVERLAP').length).toBeGreaterThan(0);
    }
  });
});
