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
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { ChurchFacilitiesService } from './church-facilities.service';
import { UpsertFacilityDto } from './dto/upsert-facility.dto';
import { SkipPhoneEnforcement } from '../common/decorators/skip-phone-enforcement.decorator';

@Controller('church/facilities')
@UseGuards(JwtAuthGuard, RolesGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class ChurchFacilitiesController {
  constructor(private facilities: ChurchFacilitiesService) {}

  @Get()
  @SkipPhoneEnforcement()
  @RequireUiCapability('church-facility-view')
  list(
    @CurrentUser('sub') userId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.facilities.list(userId, includeInactive === 'true');
  }

  @Post()
  @RequireUiCapability('church-facility-manage')
  create(@CurrentUser('sub') userId: string, @Body() dto: UpsertFacilityDto) {
    return this.facilities.create(userId, dto);
  }

  @Patch(':id')
  @RequireUiCapability('church-facility-manage')
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpsertFacilityDto,
  ) {
    return this.facilities.update(userId, id, dto);
  }
}
