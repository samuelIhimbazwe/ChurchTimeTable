import { AttendanceOperationalStatus } from '@prisma/client';
import { IsObject, IsOptional } from 'class-validator';

export class UpdateAttendanceWeightsDto {
  @IsOptional()
  @IsObject()
  weights?: Partial<Record<AttendanceOperationalStatus, number>>;
}
