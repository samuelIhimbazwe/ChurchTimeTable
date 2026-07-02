import { Injectable } from '@nestjs/common';
import { enMessages } from './messages/en';
import { frMessages } from './messages/fr';

export type AppLocale = 'en' | 'fr';

const catalogs: Record<AppLocale, Record<string, string>> = {
  en: enMessages,
  fr: frMessages,
};

@Injectable()
export class I18nService {
  resolveLocale(header?: string): AppLocale {
    if (!header) return 'en';
    const primary = header.split(',')[0].trim().toLowerCase();
    if (primary.startsWith('fr')) return 'fr';
    if (primary.startsWith('en')) return 'en';
    // Legacy Kinyarwanda (`rw`) and other locales fall back to English.
    return 'en';
  }

  translate(
    locale: AppLocale,
    key: string,
    fallback?: string,
    params?: Record<string, string | number>,
  ): string {
    let message =
      catalogs[locale][key] ?? catalogs.en[key] ?? fallback ?? key;
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        message = message.replace(
          new RegExp(`\\{${name}\\}`, 'g'),
          String(value),
        );
      }
    }
    return message;
  }

  notification(
    locale: AppLocale,
    titleKey: string,
    bodyKey: string,
    params?: Record<string, string | number>,
  ): { title: string; body: string } {
    return {
      title: this.translate(locale, titleKey, undefined, params),
      body: this.translate(locale, bodyKey, undefined, params),
    };
  }
}
