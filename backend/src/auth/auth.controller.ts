import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { REFRESH_COOKIE_NAME } from './auth.constants';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.register(dto);
    this.setRefreshCookie(res, session.refreshToken, session.refreshTokenExpiresAt);
    return session.response;
  }

  @Post('login')
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
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const session = await this.authService.refresh(refreshToken ?? '');
    this.setRefreshCookie(res, session.refreshToken, session.refreshTokenExpiresAt);
    return session.response;
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.cookies?.[REFRESH_COOKIE_NAME]);
    res.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions());
    return { loggedOut: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser('sub') userId: string) {
    return this.authService.me(userId);
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
