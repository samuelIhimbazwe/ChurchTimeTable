import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  CHOIR_ID_HEADER,
  MAIN_CHOIR_ID,
} from '../constants/choir.constants';
import { choirContextStorage } from '../choir/choir-context.storage';

@Injectable()
export class ChoirContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const header = req.headers[CHOIR_ID_HEADER];
    const choirId =
      typeof header === 'string' && header.trim().length > 0
        ? header.trim()
        : MAIN_CHOIR_ID;

    (req as Request & { activeChoirId?: string }).activeChoirId = choirId;

    choirContextStorage.run({ choirId }, () => next());
  }
}
