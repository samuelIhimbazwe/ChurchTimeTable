import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '../decorators/current-user.decorator';
import { SKIP_PHONE_ENFORCEMENT_KEY } from '../decorators/skip-phone-enforcement.decorator';
import { MemberPhoneEnforcementService } from '../member/member-phone-enforcement.service';

@Injectable()
export class PhoneOperationalGuard implements CanActivate {
  constructor(
    private phoneEnforcement: MemberPhoneEnforcementService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_PHONE_ENFORCEMENT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skip) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;
    if (!user) {
      return true;
    }

    await this.phoneEnforcement.assertCanOperate(
      user.sub,
      user.roles ?? [],
    );
    return true;
  }
}
