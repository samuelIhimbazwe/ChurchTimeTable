import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PermissionsResolver } from '../permissions.resolver';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private permissionsResolver: PermissionsResolver,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'dev-secret'),
    });
  }

  async validate(payload: { sub: string; email: string }): Promise<JwtPayload> {
    const resolved = await this.permissionsResolver.resolveForUser(payload.sub);
    if (!resolved.isActive) {
      throw new UnauthorizedException('Invalid session');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      roles: resolved.roles,
      permissions: resolved.permissions,
      memberId: resolved.memberId,
    };
  }
}
