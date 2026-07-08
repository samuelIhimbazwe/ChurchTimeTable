import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AcceptInviteDto } from '../account-invites/dto/accept-invite.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AccountInvitesService } from '../account-invites/account-invites.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { REFRESH_COOKIE_NAME } from './auth.constants';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private passwordReset: PasswordResetService,
    private accountInvites: AccountInvitesService,
    private config: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.register(dto);
    this.setRefreshCookie(res, session.refreshToken, session.refreshTokenExpiresAt);
    return session.response;
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.login(dto);
    this.setRefreshCookie(res, session.refreshToken, session.refreshTokenExpiresAt);
    return session.response;
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken =
      req.cookies?.[REFRESH_COOKIE_NAME] ?? dto.refreshToken ?? '';
    const session = await this.authService.refresh(refreshToken);
    this.setRefreshCookie(res, session.refreshToken, session.refreshTokenExpiresAt);
    return session.response;
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Body() dto: RefreshDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken =
      req.cookies?.[REFRESH_COOKIE_NAME] ?? dto.refreshToken;
    await this.authService.logout(refreshToken);
    res.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions());
    return { loggedOut: true };
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordReset.requestReset(dto.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordReset.resetPassword(dto.token, dto.password);
  }

  @Get('invite')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  previewInvite(@Query('token') token: string) {
    return this.accountInvites.previewToken(token ?? '');
  }

  @Post('accept-invite')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async acceptInvite(
    @Body() dto: AcceptInviteDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.acceptInvite(dto);
    this.setRefreshCookie(res, session.refreshToken, session.refreshTokenExpiresAt);
    return session.response;
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(
    @CurrentUser('sub') userId: string,
    @Query('choirId') choirId?: string,
  ) {
    return this.authService.me(userId, choirId);
  }

  @Patch('onboarding-complete')
  @UseGuards(JwtAuthGuard)
  completeOnboarding(@CurrentUser('sub') userId: string) {
    return this.authService.completeOnboarding(userId);
  }

  private setRefreshCookie(
    res: Response,
    refreshToken: string,
    expiresAt: Date,
  ) {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      ...this.cookieOptions(),
      expires: expiresAt,
      maxAge: Math.max(expiresAt.getTime() - Date.now(), 0),
    });
  }

  private cookieOptions() {
    const secure = this.config.get('NODE_ENV') === 'production';

    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure,
      path: '/api/v1/auth',
    };
  }
}
