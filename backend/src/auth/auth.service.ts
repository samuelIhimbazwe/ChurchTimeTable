import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ROLES } from '../common/constants/roles';
import { MemberStatus } from '@prisma/client';
import { PermissionsResolver } from './permissions.resolver';
import { MemberNumberService } from '../members/member-number.service';
import { MemberPhoneEnforcementService } from '../common/member/member-phone-enforcement.service';
import { ContributionCapabilityResolverService } from '../common/choir/contribution-capability-resolver.service';
import { WelfareCapabilityResolverService } from '../common/choir/welfare-capability-resolver.service';
import { DisciplineCapabilityResolverService } from '../common/choir/discipline-capability-resolver.service';
import { OpsCapabilityResolverService } from '../common/choir/ops-capability-resolver.service';
import { durationToMs } from './auth.constants';
import {
  AccountInactiveException,
  AuthConflictException,
  AuthUnauthorizedException,
} from '../common/exceptions/auth.exception';

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: string;
}

interface AuthSessionResult {
  response: AuthTokenResponse;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private permissionsResolver: PermissionsResolver,
    private memberNumberService: MemberNumberService,
    private phoneEnforcement: MemberPhoneEnforcementService,
    private contributionCapabilities: ContributionCapabilityResolverService,
    private welfareCapabilities: WelfareCapabilityResolverService,
    private disciplineCapabilities: DisciplineCapabilityResolverService,
    private opsCapabilities: OpsCapabilityResolverService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new AuthConflictException('EMAIL_ALREADY_REGISTERED');
    }

    const nationalIdTaken = await this.prisma.member.findUnique({
      where: { nationalId: dto.nationalId },
    });
    if (nationalIdTaken) {
      throw new AuthConflictException('NATIONAL_ID_ALREADY_REGISTERED');
    }

    const memberRole = await this.prisma.role.findUnique({
      where: { name: ROLES.MEMBER },
    });
    if (!memberRole) {
      throw new ConflictException('System roles not seeded. Run prisma seed.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.$transaction(async (tx) => {
      const memberNumber = await this.memberNumberService.generateMemberNumber(tx);
      const created = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          preferredLanguage: dto.preferredLanguage ?? 'rw',
          termsAcceptedAt: new Date(),
          member: {
            create: {
              firstName: dto.firstName,
              lastName: dto.lastName,
              phone: dto.phone.trim(),
              nationalId: dto.nationalId.trim(),
              ministry: 'BOTH',
              status: MemberStatus.NEW_MEMBER,
              onboardingCompleted: false,
              memberNumber,
              profile: {
                create: {
                  churchRelationship: dto.churchRelationship ?? 'NEW_TO_CHURCH',
                  signupInterests: dto.interests?.length
                    ? (dto.interests as unknown as import('@prisma/client').Prisma.InputJsonValue)
                    : undefined,
                  notes: dto.relationshipNotes?.trim() || undefined,
                },
              },
            },
          },
          userRoles: { create: { roleId: memberRole.id } },
        },
        include: { member: true },
      });
      return created;
    });

    return this.issueSession(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { member: true },
    });
    if (!user) {
      throw new AuthUnauthorizedException('INVALID_CREDENTIALS');
    }
    if (!user.isActive) {
      throw new AccountInactiveException('ACCOUNT_INACTIVE');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new AuthUnauthorizedException('INVALID_CREDENTIALS');
    }

    return this.issueSession(user.id, user.email);
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        messageKey: 'INVALID_SESSION',
      });
    }

    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        isActive: true,
        refreshTokenHash: true,
        refreshTokenExpiresAt: true,
      },
    });

    if (
      !user ||
      !user.isActive ||
      !user.refreshTokenHash ||
      !user.refreshTokenExpiresAt ||
      user.refreshTokenExpiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        messageKey: 'INVALID_SESSION',
      });
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        messageKey: 'INVALID_SESSION',
      });
    }

    return this.issueSession(user.id, user.email);
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return { loggedOut: true as const };
    }

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(refreshToken, {
        secret: this.refreshJwtSecret,
        ignoreExpiration: true,
      });

      await this.prisma.user.update({
        where: { id: payload.sub },
        data: {
          refreshTokenHash: null,
          refreshTokenExpiresAt: null,
        },
      });
    } catch (_) {
      // Clearing an invalid cookie is still safe; ignore malformed tokens.
    }

    return { loggedOut: true as const };
  }

  async me(userId: string, choirId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        preferredLanguage: true,
        member: {
          select: {
            id: true,
            memberNumber: true,
            firstName: true,
            lastName: true,
            phone: true,
            ministry: true,
            status: true,
            onboardingCompleted: true,
          },
        },
        userRoles: { include: { role: true } },
      },
    });
    if (!user) return null;

    const { roles, permissions } =
      await this.permissionsResolver.resolveForUser(userId);

    const member = user.member
      ? {
          ...user.member,
          missingPhone:
            (user.member.status === MemberStatus.ACTIVE ||
              user.member.status === MemberStatus.NEW_MEMBER) &&
            !user.member.phone,
        }
      : null;

    const phoneEnforcementState =
      await this.phoneEnforcement.buildAuthEnforcementState(userId, roles);

    const contributionAuth = choirId
      ? await this.contributionCapabilities.resolveGrantsToCapabilities(
          userId,
          choirId,
        )
      : undefined;

    const welfareAuth = choirId
      ? await this.welfareCapabilities.resolveGrantsToCapabilities(
          userId,
          choirId,
        )
      : undefined;

    const disciplineAuth = choirId
      ? await this.disciplineCapabilities.resolveGrantsToCapabilities(
          userId,
          choirId,
        )
      : undefined;

    const opsAuth = choirId
      ? await this.opsCapabilities.resolveGrantsToCapabilities(
          userId,
          choirId,
        )
      : undefined;

    return {
      id: user.id,
      email: user.email,
      preferredLanguage: user.preferredLanguage,
      member,
      roles,
      permissions,
      onboardingCompleted: user.member?.onboardingCompleted ?? false,
      phoneEnforcement: phoneEnforcementState,
      contributionAuth,
      welfareAuth,
      disciplineAuth,
      opsAuth,
      /** Capabilities are resolved fresh on /auth/me — not embedded in JWT (see migration-notes/01-summary.md). */
    };
  }

  async completeOnboarding(userId: string) {
    const member = await this.prisma.member.findFirst({
      where: { userId },
    });
    if (!member) {
      return { onboardingCompleted: false };
    }

    const updated = await this.prisma.member.update({
      where: { id: member.id },
      data: { onboardingCompleted: true },
      select: { onboardingCompleted: true },
    });

    return updated;
  }

  private get accessTokenExpiresIn() {
    return this.config.get<string>('JWT_EXPIRES_IN', '7d');
  }

  private get refreshTokenExpiresIn() {
    return this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
  }

  private get refreshJwtSecret() {
    return this.config.get<string>(
      'JWT_REFRESH_SECRET',
      this.config.get<string>('JWT_SECRET', 'dev-secret'),
    );
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.jwt.verifyAsync<{ sub: string; email: string; type: string }>(
        refreshToken,
        {
          secret: this.refreshJwtSecret,
        },
      );
    } catch (_) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        messageKey: 'INVALID_SESSION',
      });
    }
  }

  private async issueSession(userId: string, email: string): Promise<AuthSessionResult> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: this.config.get<string>('JWT_SECRET', 'dev-secret'),
        expiresIn: this.accessTokenExpiresIn as never,
      },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, email, type: 'refresh' },
      {
        secret: this.refreshJwtSecret,
        expiresIn: this.refreshTokenExpiresIn as never,
      },
    );

    const refreshTokenExpiresAt = new Date(
      Date.now() + durationToMs(this.refreshTokenExpiresIn, 30 * 24 * 60 * 60 * 1000),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash: await bcrypt.hash(refreshToken, 10),
        refreshTokenExpiresAt,
      },
    });

    return {
      response: {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: this.accessTokenExpiresIn,
        refreshToken,
        refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
      },
      refreshToken,
      refreshTokenExpiresAt,
    };
  }
}
