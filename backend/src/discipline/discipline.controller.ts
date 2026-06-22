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
import { DisciplineStage } from '@prisma/client';
import { DisciplineService } from './discipline.service';
import { CreateDisciplineDto } from './dto/create-discipline.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('discipline')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class DisciplineController {
  constructor(private disciplineService: DisciplineService) {}

  @Post()
  create(@Body() dto: CreateDisciplineDto, @CurrentUser() user: JwtPayload) {
    return this.disciplineService.create(dto, user.sub);
  }

  @Patch(':id/advance')
  advance(
    @Param('id') id: string,
    @Body() body: { resolution?: string; actionTaken?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.disciplineService.advanceStage(
      id,
      user.sub,
      body.resolution,
      body.actionTaken,
    );
  }

  @Get()
  findAll(
    @Query() query: PaginationDto & {
      memberId?: string;
      stage?: DisciplineStage;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.disciplineService.findAll(
      user.sub,
      query.page,
      query.limit,
      { memberId: query.memberId, stage: query.stage },
      user.memberId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.disciplineService.findOne(id, user.sub, user.memberId);
  }
}
