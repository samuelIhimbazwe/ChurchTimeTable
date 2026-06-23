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
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
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
@UseGuards(JwtAuthGuard, RolesGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class ChoirCustomRolesController {
  constructor(private roles: ChoirCustomRolesService) {}

  @Get()
  @RequireUiCapability('roles-custom-manage')
  list(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.roles.list(user.sub, choirId, includeInactive === 'true');
  }

  @Get(':id')
  @RequireUiCapability('roles-custom-manage')
  getOne(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Param('id') id: string,
  ) {
    return this.roles.getById(user.sub, choirId, id);
  }

  @Get(':id/audit')
  @RequireUiCapability('roles-custom-manage')
  audit(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Param('id') id: string,
  ) {
    return this.roles.auditTrail(user.sub, choirId, id);
  }

  @Post()
  @RequireUiCapability('roles-custom-manage')
  create(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Body() dto: CreateCustomRoleDto,
  ) {
    return this.roles.create(user.sub, choirId, dto);
  }

  @Patch(':id')
  @RequireUiCapability('roles-custom-manage')
  update(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomRoleDto,
  ) {
    return this.roles.update(user.sub, choirId, id, dto);
  }

  @Post(':id/assign')
  @RequireUiCapability('roles-custom-manage')
  assign(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Param('id') id: string,
    @Body() dto: AssignCustomRoleDto,
  ) {
    return this.roles.assignMember(user.sub, choirId, id, dto);
  }

  @Delete(':id/members/:memberId')
  @RequireUiCapability('roles-custom-manage')
  unassign(
    @CurrentUser() user: JwtPayload,
    @ChoirId() choirId: string,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.roles.unassignMember(user.sub, choirId, id, memberId);
  }
}
