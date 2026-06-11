import {
  ChurchScheduleActivityType,
  ChurchScheduleScopeType,
} from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateChurchScheduleSubmissionDto {
  @IsEnum(ChurchScheduleScopeType)
  scopeType!: ChurchScheduleScopeType;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  scopeId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsEnum(ChurchScheduleActivityType)
  activityType!: ChurchScheduleActivityType;

  @IsDateString()
  calendarDate!: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsUUID()
  facilityId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  purpose?: string;

  @IsOptional()
  @IsDateString()
  weekOf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
