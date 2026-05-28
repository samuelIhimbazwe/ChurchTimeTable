import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PhysicalStatus, ReasonCategory } from '@prisma/client';
import { AttendanceOperationalStatus } from '@prisma/client';

export class UpsertAttendanceDto {
  @IsUUID()
  eventId: string;

  @IsUUID()
  memberId: string;

  @IsEnum(PhysicalStatus)
  physicalStatus: PhysicalStatus;

  @IsOptional()
  @IsEnum(ReasonCategory)
  reasonCategory?: ReasonCategory;

  @IsOptional()
  @IsString()
  reasonType?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(AttendanceOperationalStatus)
  operationalStatus?: AttendanceOperationalStatus;

  @IsOptional()
  clientUpdatedAt?: string;
}
