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
import { RolesGuard } from '../common/guards/roles.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireAnyPermissions, RequirePermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { ChurchFacilitiesService } from './church-facilities.service';
import { UpsertFacilityDto } from './dto/upsert-facility.dto';
import { SkipPhoneEnforcement } from '../common/decorators/skip-phone-enforcement.decorator';

@Controller('church/facilities')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class ChurchFacilitiesController {
  constructor(private facilities: ChurchFacilitiesService) {}

  @Get()
  @SkipPhoneEnforcement()
  @RequireAnyPermissions(
    PERMISSIONS.CHURCH_FACILITY_VIEW,
    PERMISSIONS.CHURCH_FACILITY_MANAGE,
  )
  list(
    @CurrentUser('sub') userId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.facilities.list(userId, includeInactive === 'true');
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CHURCH_FACILITY_MANAGE)
  create(@CurrentUser('sub') userId: string, @Body() dto: UpsertFacilityDto) {
    return this.facilities.create(userId, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.CHURCH_FACILITY_MANAGE)
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpsertFacilityDto,
  ) {
    return this.facilities.update(userId, id, dto);
  }
}
