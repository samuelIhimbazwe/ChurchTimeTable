import { HttpException, HttpStatus } from '@nestjs/common';

export class AuthUnauthorizedException extends HttpException {
  constructor(messageKey = 'INVALID_CREDENTIALS') {
    super({ code: 'UNAUTHORIZED', messageKey }, HttpStatus.UNAUTHORIZED);
  }
}

export class AuthConflictException extends HttpException {
  constructor(messageKey = 'EMAIL_ALREADY_REGISTERED') {
    super({ code: 'CONFLICT', messageKey }, HttpStatus.CONFLICT);
  }
}

export class AccountInactiveException extends HttpException {
  constructor(messageKey = 'ACCOUNT_INACTIVE') {
    super({ code: 'UNAUTHORIZED', messageKey }, HttpStatus.UNAUTHORIZED);
  }
}
