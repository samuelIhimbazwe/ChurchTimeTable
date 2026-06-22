import {
  Body,
  Controller,
  Delete,
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
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { ChoirId } from '../common/decorators/choir-id.decorator';
import { ChoirCustomRolesService } from './choir-custom-roles.service';
import {
  AssignCustomRoleDto,
  CreateCustomRoleDto,
  UpdateCustomRoleDto,
} from './dto/custom-role.dto';

@Controller('choir/custom-roles')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class ChoirCustomRolesController {
  constructor(private roles: ChoirCustomRolesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.CHOIR_CUSTOM_ROLE_MANAGE)
  list(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.roles.list(user.sub, choirId, includeInactive === 'true');
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CHOIR_CUSTOM_ROLE_MANAGE)
  getOne(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Param('id') id: string,
  ) {
    return this.roles.getById(user.sub, choirId, id);
  }

  @Get(':id/audit')
  @RequirePermissions(PERMISSIONS.CHOIR_CUSTOM_ROLE_MANAGE)
  audit(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Param('id') id: string,
  ) {
    return this.roles.auditTrail(user.sub, choirId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CHOIR_CUSTOM_ROLE_MANAGE)
  create(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Body() dto: CreateCustomRoleDto,
  ) {
    return this.roles.create(user.sub, choirId, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.CHOIR_CUSTOM_ROLE_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomRoleDto,
  ) {
    return this.roles.update(user.sub, choirId, id, dto);
  }

  @Post(':id/assign')
  @RequirePermissions(PERMISSIONS.CHOIR_CUSTOM_ROLE_MANAGE)
  assign(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Param('id') id: string,
    @Body() dto: AssignCustomRoleDto,
  ) {
    return this.roles.assignMember(user.sub, choirId, id, dto);
  }

  @Delete(':id/members/:memberId')
  @RequirePermissions(PERMISSIONS.CHOIR_CUSTOM_ROLE_MANAGE)
  unassign(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.roles.unassignMember(user.sub, choirId, id, memberId);
  }
}
