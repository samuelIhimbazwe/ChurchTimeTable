import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  AttendanceOperationalStatus,
  AttendanceReplacementType,
  PhysicalStatus,
  ReasonCategory,
} from '@prisma/client';

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
  @IsString()
  excuseReason?: string;

  @IsOptional()
  @IsEnum(AttendanceReplacementType)
  replacementType?: AttendanceReplacementType;

  @IsOptional()
  @IsBoolean()
  countsAsOfficial?: boolean;

  @IsOptional()
  @IsBoolean()
  voluntaryExtra?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  lateMinutes?: number;

  @IsOptional()
  @IsString()
  excuseEvidenceUrl?: string;

  @IsOptional()
  @IsBoolean()
  excuseApproved?: boolean;

  @IsOptional()
  clientUpdatedAt?: string;
}
