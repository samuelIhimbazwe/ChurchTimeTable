import { I18nService } from './i18n.service';

describe('I18nService', () => {
  const service = new I18nService();

  it('defaults to Kinyarwanda when header missing', () => {
    expect(service.resolveLocale()).toBe('rw');
  });

  it('interpolates notification placeholders in all locales', () => {
    for (const locale of ['rw', 'en', 'fr'] as const) {
      const { body } = service.notification(
        locale,
        'NOTIFICATION_SWAP_TITLE',
        'NOTIFICATION_SWAP_REQUESTED_BODY',
        { memberName: 'Jean Baptiste' },
      );
      expect(body).toContain('Jean Baptiste');
      expect(body).not.toContain('{memberName}');
    }
  });

  it('translates schedule conflict messageKey in Kinyarwanda', () => {
    const msg = service.translate('rw', 'SCHEDULE_OVERLAP');
    expect(msg).toMatch(/gahunda|amasaha/i);
  });
});
