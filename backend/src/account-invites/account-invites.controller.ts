import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { AccountInvitesService } from './account-invites.service';
import { CreateAccountInviteDto } from './dto/create-account-invite.dto';
import { ListAccountInvitesDto } from './dto/list-account-invites.dto';

@Controller('invites')
@UseGuards(JwtAuthGuard, PhoneOperationalGuard)
export class AccountInvitesController {
  constructor(private invites: AccountInvitesService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() query: ListAccountInvitesDto) {
    return this.invites.list(user.sub, query);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAccountInviteDto) {
    return this.invites.create(user.sub, dto);
  }

  @Patch(':id/revoke')
  revoke(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.invites.revoke(user.sub, id);
  }

  @Post(':id/resend')
  resend(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.invites.resend(user.sub, id);
  }
}
