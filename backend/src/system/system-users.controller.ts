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
import { RolesGuard } from '../common/guards/roles.guard';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { SystemUsersService } from './system-users.service';
import { ListSystemUsersDto } from './dto/list-system-users.dto';
import { CreateSystemUserDto } from './dto/create-system-user.dto';
import { UpdateSystemUserDto } from './dto/update-system-user.dto';
import { AssignSystemUserRolesDto } from './dto/assign-system-user-roles.dto';
import { ResetSystemUserPasswordDto } from './dto/reset-system-user-password.dto';

@Controller('system/users')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class SystemUsersController {
  constructor(private users: SystemUsersService) {}

  @Get()
  @RequireAnyPermissions(
    PERMISSIONS.ADMIN_USERS_VIEW,
    PERMISSIONS.ADMIN_USERS_MANAGE,
  )
  list(@Query() query: ListSystemUsersDto) {
    return this.users.list(query);
  }

  @Get('roles')
  @RequireAnyPermissions(
    PERMISSIONS.ADMIN_USERS_VIEW,
    PERMISSIONS.ADMIN_USERS_MANAGE,
  )
  listRoles() {
    return this.users.listRoles();
  }

  @Get(':id')
  @RequireAnyPermissions(
    PERMISSIONS.ADMIN_USERS_VIEW,
    PERMISSIONS.ADMIN_USERS_MANAGE,
  )
  getById(@Param('id') id: string) {
    return this.users.getById(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ADMIN_USERS_MANAGE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSystemUserDto) {
    return this.users.create(user.sub, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ADMIN_USERS_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSystemUserDto,
  ) {
    return this.users.update(user.sub, id, dto);
  }

  @Patch(':id/roles')
  @RequirePermissions(PERMISSIONS.ADMIN_USERS_MANAGE)
  assignRoles(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AssignSystemUserRolesDto,
  ) {
    return this.users.assignRoles(user.sub, id, dto);
  }

  @Post(':id/reset-password')
  @RequirePermissions(PERMISSIONS.ADMIN_USERS_MANAGE)
  resetPassword(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ResetSystemUserPasswordDto,
  ) {
    return this.users.resetPassword(user.sub, id, dto);
  }
}
