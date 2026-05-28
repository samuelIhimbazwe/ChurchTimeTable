import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES } from '../constants/roles';
import { JwtPayload } from '../decorators/current-user.decorator';

export const SUPER_ADMIN_ONLY_KEY = 'superAdminOnly';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<boolean>(
      SUPER_ADMIN_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    if (!user?.roles.includes(ROLES.SUPER_ADMIN)) {
      throw new ForbiddenException('Super Admin access required');
    }
    return true;
  }
}
