import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterFcmDto } from './dto/register-fcm.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('fcm-token')
  registerFcm(
    @CurrentUser('sub') userId: string,
    @Body() dto: RegisterFcmDto,
  ) {
    return this.usersService.registerFcmToken(userId, dto.token);
  }

  @Post('language')
  updateLanguage(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateLanguageDto,
  ) {
    return this.usersService.updateLanguage(userId, dto.preferredLanguage);
  }
}
