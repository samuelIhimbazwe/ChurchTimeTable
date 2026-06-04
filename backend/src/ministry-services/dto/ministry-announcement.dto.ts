import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  MinistryAnnouncementAudience,
  MinistryAnnouncementPriority,
} from '@prisma/client';

export class CreateMinistryAnnouncementDto {
  @IsUUID()
  ministryId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsEnum(MinistryAnnouncementPriority)
  priority?: MinistryAnnouncementPriority;

  @IsOptional()
  @IsEnum(MinistryAnnouncementAudience)
  audienceType?: MinistryAnnouncementAudience;

  @IsOptional()
  @IsString()
  audienceRef?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateMinistryAnnouncementDto {
  @IsOptional()
  @IsString()
  @MaxLength(256)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(MinistryAnnouncementPriority)
  priority?: MinistryAnnouncementPriority;

  @IsOptional()
  @IsEnum(MinistryAnnouncementAudience)
  audienceType?: MinistryAnnouncementAudience;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
