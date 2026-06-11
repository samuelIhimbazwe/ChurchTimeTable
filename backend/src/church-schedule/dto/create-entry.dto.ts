import {
  ChurchScheduleActivityType,
  ChurchScheduleScopeType,
} from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateChurchScheduleEntryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsEnum(ChurchScheduleActivityType)
  activityType!: ChurchScheduleActivityType;

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
  @IsBoolean()
  isChurchBlock?: boolean;

  @IsOptional()
  @IsEnum(ChurchScheduleScopeType)
  scopeType?: ChurchScheduleScopeType;

  @IsOptional()
  @IsString()
  scopeId?: string;
}
