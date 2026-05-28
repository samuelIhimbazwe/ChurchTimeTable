import { Injectable } from '@nestjs/common';

import { enMessages } from './messages/en';

import { frMessages } from './messages/fr';

import { rwMessages } from './messages/rw';



export type AppLocale = 'rw' | 'en' | 'fr';



const catalogs: Record<AppLocale, Record<string, string>> = {

  rw: rwMessages,

  en: enMessages,

  fr: frMessages,

};



@Injectable()

export class I18nService {

  resolveLocale(header?: string): AppLocale {

    if (!header) return 'rw';

    const primary = header.split(',')[0].trim().toLowerCase();

    if (primary.startsWith('fr')) return 'fr';

    if (primary.startsWith('en')) return 'en';

    if (primary.startsWith('rw')) return 'rw';

    return 'rw';

  }



  translate(

    locale: AppLocale,

    key: string,

    fallback?: string,

    params?: Record<string, string | number>,

  ): string {

    let message =

      catalogs[locale][key] ?? catalogs.rw[key] ?? fallback ?? key;

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

