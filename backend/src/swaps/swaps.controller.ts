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
import { SwapStatus } from '@prisma/client';
import { SwapsService } from './swaps.service';
import { CreateSwapDto } from './dto/create-swap.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('swaps')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SwapsController {
  constructor(private swapsService: SwapsService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: SwapStatus,
    @CurrentUser() user?: JwtPayload,
  ) {
    const leaderView = user?.permissions?.includes(PERMISSIONS.SWAP_MANAGE);
    return this.swapsService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      { status, memberId: leaderView ? undefined : user?.memberId },
    );
  }

  @Post()
  request(
    @Body() dto: CreateSwapDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.memberId) throw new Error('Member profile required');
    return this.swapsService.request(dto, user.memberId, user.sub);
  }

  @Patch(':id/respond')
  respond(
    @Param('id') id: string,
    @Body('accept') accept: boolean,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.memberId) throw new Error('Member profile required');
    return this.swapsService.respond(id, accept, user.memberId, user.sub);
  }

  @Patch(':id/approve')
  @RequirePermissions(PERMISSIONS.SWAP_MANAGE)
  approve(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.swapsService.leaderApprove(id, user.sub, notes);
  }

  @Patch(':id/finalize')
  @RequirePermissions(PERMISSIONS.SWAP_MANAGE)
  finalize(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.swapsService.finalize(id, user.sub);
  }
}
