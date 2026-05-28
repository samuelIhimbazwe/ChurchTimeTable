import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('bulk')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_WRITE)
  bulkUpsert(
    @Body() dto: BulkAttendanceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attendanceService.bulkUpsert(dto.records, user.sub);
  }

  @Patch(':id/excused-review')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_WRITE)
  reviewExcused(
    @Param('id') id: string,
    @Body('approve') approve: boolean,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attendanceService.approveExcused(id, approve, user.sub);
  }

  @Put()
  @RequirePermissions(PERMISSIONS.ATTENDANCE_WRITE)
  upsert(
    @Body() dto: UpsertAttendanceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attendanceService.upsert(dto, user.sub);
  }

  @Get('event/:eventId')
  @RequirePermissions(PERMISSIONS.EVENT_READ)
  byEvent(
    @Param('eventId') eventId: string,
    @Query() query: PaginationDto,
  ) {
    return this.attendanceService.findByEvent(
      eventId,
      query.page,
      query.limit,
    );
  }

  @Get('member/:memberId')
  @RequirePermissions(PERMISSIONS.EVENT_READ)
  byMember(
    @Param('memberId') memberId: string,
    @Query() query: PaginationDto,
  ) {
    return this.attendanceService.findByMember(
      memberId,
      query.page,
      query.limit,
    );
  }
}
