import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { I18nService, AppLocale } from '../../i18n/i18n.service';

export interface LocaleRequest extends Request {
  locale: AppLocale;
}

@Injectable()
export class LocaleMiddleware implements NestMiddleware {
  constructor(private i18n: I18nService) {}

  use(req: LocaleRequest, _res: Response, next: NextFunction) {
    req.locale = this.i18n.resolveLocale(req.headers['accept-language'] as string);
    next();
  }
}
