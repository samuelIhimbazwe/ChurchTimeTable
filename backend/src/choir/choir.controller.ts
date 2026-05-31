import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ChoirRotationService } from './choir-rotation.service';
import { RotationAssignDto } from './dto/rotation-assign.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('choir')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class ChoirController {
  constructor(private rotation: ChoirRotationService) {}

  @Get('rotation/pool/:eventId')
  @RequirePermissions(PERMISSIONS.EVENT_READ)
  getPool(@Param('eventId') eventId: string) {
    return this.rotation.getPool(eventId);
  }

  @Post('rotation/events/:eventId/assign')
  @RequirePermissions(PERMISSIONS.ASSIGNMENT_WRITE)
  autoAssign(
    @Param('eventId') eventId: string,
    @Body() dto: RotationAssignDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.rotation.autoAssign(eventId, userId, dto.count);
  }
}
