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
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { SystemUsersService } from './system-users.service';
import { ListSystemUsersDto } from './dto/list-system-users.dto';
import { CreateSystemUserDto } from './dto/create-system-user.dto';
import { UpdateSystemUserDto } from './dto/update-system-user.dto';
import { AssignSystemUserRolesDto } from './dto/assign-system-user-roles.dto';
import { ResetSystemUserPasswordDto } from './dto/reset-system-user-password.dto';

@Controller('system/users')
@UseGuards(JwtAuthGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class SystemUsersController {
  constructor(private users: SystemUsersService) {}

  @Get()
  @RequireUiCapability('admin-users-manage')
  list(@Query() query: ListSystemUsersDto) {
    return this.users.list(query);
  }

  @Get('roles')
  @RequireUiCapability('admin-users-manage')
  listRoles() {
    return this.users.listRoles();
  }

  @Get(':id')
  @RequireUiCapability('admin-users-manage')
  getById(@Param('id') id: string) {
    return this.users.getById(id);
  }

  @Post()
  @RequireUiCapability('admin-users-manage')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSystemUserDto) {
    return this.users.create(user.sub, dto);
  }

  @Patch(':id')
  @RequireUiCapability('admin-users-manage')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSystemUserDto,
  ) {
    return this.users.update(user.sub, id, dto);
  }

  @Patch(':id/roles')
  @RequireUiCapability('admin-users-manage')
  assignRoles(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AssignSystemUserRolesDto,
  ) {
    return this.users.assignRoles(user.sub, id, dto);
  }

  @Post(':id/reset-password')
  @RequireUiCapability('admin-users-manage')
  resetPassword(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ResetSystemUserPasswordDto,
  ) {
    return this.users.resetPassword(user.sub, id, dto);
  }
}
