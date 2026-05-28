import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiErrorResponse } from '../interfaces/api-response.interface';
import { I18nService } from '../../i18n/i18n.service';
import { LocaleRequest } from '../middleware/locale.middleware';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<LocaleRequest>();
    const locale = request.locale ?? 'rw';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = this.i18n.translate(locale, code);
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const obj = body as Record<string, unknown>;
        code = (obj.code as string) || this.statusToCode(status);
        const messageKey = obj.messageKey as string | undefined;
        if (messageKey) {
          message = this.i18n.translate(locale, messageKey, obj.message as string);
        } else if (typeof obj.message === 'string') {
          message = this.i18n.translate(locale, code, obj.message);
        } else if (Array.isArray(obj.message)) {
          message = obj.message.join(', ');
          code = 'VALIDATION_ERROR';
          message = this.i18n.translate(locale, code, message);
        }
        details = obj.details as Record<string, unknown> | undefined;
      } else {
        code = this.statusToCode(status);
        message = this.i18n.translate(locale, code);
      }
    }

    const payload: ApiErrorResponse = {
      success: false,
      error: { code, message, details },
    };

    response.status(status).json(payload);
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'BUSINESS_RULE_VIOLATION',
    };
    return map[status] ?? 'INTERNAL_ERROR';
  }
}
