import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { RehearsalAttendanceStatus } from '@prisma/client';

class RehearsalAttendanceEntryDto {
  @IsUUID()
  memberId: string;

  @IsEnum(RehearsalAttendanceStatus)
  status: RehearsalAttendanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordRehearsalAttendanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RehearsalAttendanceEntryDto)
  entries: RehearsalAttendanceEntryDto[];
}
