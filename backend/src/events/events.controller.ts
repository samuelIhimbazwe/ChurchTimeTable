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
import { EventType, MinistryScope } from '@prisma/client';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.EVENT_WRITE)
  create(@Body() dto: CreateEventDto, @CurrentUser() user: JwtPayload) {
    return this.eventsService.create(dto, user.sub);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.EVENT_WRITE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.eventsService.update(id, dto, user.sub);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.EVENT_READ)
  findAll(
    @Query() query: PaginationDto & {
      type?: EventType;
      ministryScope?: MinistryScope;
      from?: string;
      to?: string;
    },
  ) {
    const { page, limit, type, ministryScope, from, to } = query;
    return this.eventsService.findAll(page, limit, {
      type,
      ministryScope,
      from,
      to,
    });
  }

  @Patch(':id/cancel')
  @RequirePermissions(PERMISSIONS.EVENT_WRITE)
  cancel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.eventsService.cancel(id, user.sub);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.EVENT_READ)
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }
}
