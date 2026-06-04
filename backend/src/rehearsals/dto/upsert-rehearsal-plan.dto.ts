import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { RehearsalReadinessStatus } from '@prisma/client';

class RehearsalPlanSongDto {
  @IsUUID()
  songId: string;

  @IsOptional()
  sortOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedMinutes?: number;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  readinessPercent?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

class RehearsalPlanSectionDto {
  @IsUUID()
  voiceSectionId: string;

  @IsOptional()
  @IsString()
  focusNotes?: string;

  @IsOptional()
  @IsEnum(RehearsalReadinessStatus)
  readinessStatus?: RehearsalReadinessStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  readinessPercent?: number;
}

export class UpsertRehearsalPlanDto {
  @IsOptional()
  @IsUUID()
  leaderId?: string;

  @IsOptional()
  @IsString()
  objectives?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RehearsalPlanSongDto)
  songs?: RehearsalPlanSongDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RehearsalPlanSectionDto)
  sections?: RehearsalPlanSectionDto[];
}
