import { AttendanceEscalationLevel } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class EscalateAttendanceDto {
  @IsEnum(AttendanceEscalationLevel)
  level: AttendanceEscalationLevel;

  @IsOptional()
  @IsString()
  notes?: string;
}
