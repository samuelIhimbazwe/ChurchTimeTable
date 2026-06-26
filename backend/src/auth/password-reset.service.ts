import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AppLinkService } from '../messaging/app-link.service';
import { AuditService } from '../audit/audit.service';

const TOKEN_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private prisma: PrismaService,
    private appLinks: AppLinkService,
    private audit: AuditService,
  ) {}

  async requestReset(email: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true, email: true, isActive: true },
    });

    let devResetUrl: string | undefined;

    if (user?.isActive) {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

      await this.prisma.$transaction([
        this.prisma.passwordResetToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: new Date() },
        }),
        this.prisma.passwordResetToken.create({
          data: { userId: user.id, tokenHash, expiresAt },
        }),
      ]);

      const resetUrl = this.appLinks.resetPassword(rawToken);
      this.deliverResetLink(user.email, resetUrl);

      if (this.shouldExposeDevLink()) {
        devResetUrl = resetUrl;
      }
    }

    return {
      ok: true,
      message:
        'If an account exists for that email, password reset instructions have been sent.',
      ...(devResetUrl ? { devResetUrl } : {}),
    };
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = this.hashToken(token.trim());
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, isActive: true } } },
    });

    if (
      !record ||
      record.usedAt ||
      record.expiresAt.getTime() <= Date.now() ||
      !record.user.isActive
    ) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        messageKey: 'PASSWORD_RESET_TOKEN_INVALID',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: {
          passwordHash,
          refreshTokenHash: null,
          refreshTokenExpiresAt: null,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.updateMany({
        where: {
          userId: record.userId,
          usedAt: null,
          id: { not: record.id },
        },
        data: { usedAt: new Date() },
      }),
    ]);

    await this.audit.log({
      userId: record.userId,
      action: 'PASSWORD_RESET_SELF_SERVICE',
      entity: 'User',
      entityId: record.userId,
    });

    return { ok: true };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private deliverResetLink(email: string, resetUrl: string) {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`Password reset link for ${email}: ${resetUrl}`);
      return;
    }

    // Production email delivery can be wired to SMTP or a provider later.
    this.logger.warn(
      `Password reset requested for ${email} but outbound email is not configured. Configure SMTP to deliver reset links.`,
    );
  }

  private shouldExposeDevLink(): boolean {
    return (
      process.env.PASSWORD_RESET_EXPOSE_LINK === 'true' ||
      process.env.NODE_ENV === 'test' ||
      process.env.NODE_ENV === 'development'
    );
  }
}
