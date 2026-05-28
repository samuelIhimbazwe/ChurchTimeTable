import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { BulkAssignDto } from './dto/bulk-assign.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private assignmentsService: AssignmentsService) {}

  @Post('validate')
  @RequirePermissions(PERMISSIONS.ASSIGNMENT_WRITE)
  async validate(@Body() dto: CreateAssignmentDto) {
    try {
      await this.assignmentsService.validateOnly(dto);
      return { valid: true };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Validation failed';
      const code =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { code?: string } }).response?.code
          : undefined;
      return { valid: false, code, message };
    }
  }

  @Post('bulk')
  @RequirePermissions(PERMISSIONS.ASSIGNMENT_WRITE)
  bulkAssign(
    @Body() dto: BulkAssignDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assignmentsService.bulkAssign(dto.assignments, user.sub);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ASSIGNMENT_WRITE)
  assign(
    @Body() dto: CreateAssignmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assignmentsService.assign(dto, user.sub);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ASSIGNMENT_WRITE)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.assignmentsService.remove(id, user.sub);
  }

  @Get('event/:eventId')
  @RequirePermissions(PERMISSIONS.EVENT_READ)
  findByEvent(
    @Param('eventId') eventId: string,
    @Query() query: PaginationDto,
  ) {
    return this.assignmentsService.findByEvent(
      eventId,
      query.page,
      query.limit,
    );
  }
}
