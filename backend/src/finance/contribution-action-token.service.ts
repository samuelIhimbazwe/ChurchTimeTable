import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export type ContributionApproveTokenPayload = {
  sub: string;
  cid: string;
  act: 'approve';
  choirId?: string;
};

@Injectable()
export class ContributionActionTokenService {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  createApproveToken(params: {
    userId: string;
    contributionId: string;
    choirId?: string | null;
  }): string {
    return this.jwt.sign(
      {
        sub: params.userId,
        cid: params.contributionId,
        act: 'approve',
        choirId: params.choirId ?? undefined,
      } satisfies ContributionApproveTokenPayload,
      {
        secret: this.getSecret(),
        expiresIn: '72h',
      },
    );
  }

  verifyApproveToken(token: string): {
    userId: string;
    contributionId: string;
    choirId?: string;
  } {
    try {
      const payload = this.jwt.verify<ContributionApproveTokenPayload>(token, {
        secret: this.getSecret(),
      });
      if (payload.act !== 'approve' || !payload.sub || !payload.cid) {
        throw new UnauthorizedException('Invalid approval link');
      }
      return {
        userId: payload.sub,
        contributionId: payload.cid,
        choirId: payload.choirId,
      };
    } catch {
      throw new UnauthorizedException('Approval link expired or invalid');
    }
  }

  buildQuickActionUrl(choirId: string, token: string): string {
    const base = (
      process.env.WEB_APP_URL ??
      process.env.FRONTEND_URL ??
      'http://localhost:3001'
    ).replace(/\/$/, '');
    return `${base}/choir/${choirId}/family-leadership/quick-action?token=${encodeURIComponent(token)}`;
  }

  assertTokenMatchesUser(tokenUserId: string, actorUserId: string): void {
    if (tokenUserId !== actorUserId) {
      throw new ForbiddenException(
        'This approval link was sent to another account. Sign in as the family head or deputy who received it.',
      );
    }
  }

  private getSecret(): string {
    return (
      this.config.get<string>('CONTRIBUTION_ACTION_SECRET') ??
      this.config.get<string>('JWT_SECRET', 'dev-secret')
    );
  }
}
