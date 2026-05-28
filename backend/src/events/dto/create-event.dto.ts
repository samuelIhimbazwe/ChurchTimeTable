import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { EventType, EventStatus, MinistryScope } from '@prisma/client';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsEnum(EventType)
  type: EventType;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsEnum(MinistryScope)
  ministryScope: MinistryScope;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  serviceSlot?: number;

  @IsOptional()
  @IsString()
  description?: string;

  /** e.g. WEEKLY, BIWEEKLY — stored in metadata for series grouping */
  @IsOptional()
  @IsString()
  recurrenceRule?: string;
}
