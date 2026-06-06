import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { DevotionType, DevotionVisibilityScope } from '@prisma/client';

export class CreateDevotionDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsString()
  verseReference?: string;

  @IsOptional()
  @IsString()
  verseText?: string;

  @IsEnum(DevotionType)
  type!: DevotionType;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsUUID()
  ministryId?: string;

  @IsOptional()
  @IsUUID()
  operationalUnitId?: string;

  @IsOptional()
  @IsEnum(DevotionVisibilityScope)
  visibilityScope?: DevotionVisibilityScope;

  @IsOptional()
  @IsDateString()
  prayerDate?: string;
}

export class UpdateDevotionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsString()
  verseReference?: string;

  @IsOptional()
  @IsString()
  verseText?: string;

  @IsOptional()
  @IsEnum(DevotionType)
  type?: DevotionType;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ListDevotionsQueryDto {
  @IsOptional()
  @IsEnum(DevotionType)
  type?: DevotionType;

  @IsOptional()
  @IsString()
  pinned?: string;
}
