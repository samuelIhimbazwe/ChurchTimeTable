import { HttpException, HttpStatus } from '@nestjs/common';

export class ConflictException extends HttpException {
  constructor(
    messageKey: string,
    details?: Record<string, unknown>,
  ) {
    super(
      { code: 'CONFLICT', messageKey, details },
      HttpStatus.CONFLICT,
    );
  }
}

export class BusinessRuleException extends HttpException {
  constructor(
    messageKey: string,
    details?: Record<string, unknown>,
  ) {
    super(
      { code: 'BUSINESS_RULE_VIOLATION', messageKey, details },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
