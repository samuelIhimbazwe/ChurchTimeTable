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
import { ReplacementsService } from './replacements.service';
import { CreateReplacementDto } from './dto/create-replacement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('replacements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReplacementsController {
  constructor(private replacementsService: ReplacementsService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const leaderView = user?.permissions?.includes(PERMISSIONS.SWAP_MANAGE);
    return this.replacementsService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      leaderView ? undefined : user?.memberId,
    );
  }

  @Post()
  create(
    @Body() dto: CreateReplacementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.replacementsService.create(dto, user.sub);
  }

  @Patch(':id/approve')
  @RequirePermissions(PERMISSIONS.SWAP_MANAGE)
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.replacementsService.approve(id, user.sub);
  }

  @Patch(':id/finalize')
  @RequirePermissions(PERMISSIONS.SWAP_MANAGE)
  finalize(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.replacementsService.finalize(id, user.sub);
  }
}
