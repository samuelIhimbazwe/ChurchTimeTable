import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { MAIN_CHOIR_ID } from '../constants/choir.constants';
import { getActiveChoirId } from '../choir/choir-context.storage';

export const ChoirId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request & { activeChoirId?: string }>();
    return request.activeChoirId ?? getActiveChoirId() ?? MAIN_CHOIR_ID;
  },
);
