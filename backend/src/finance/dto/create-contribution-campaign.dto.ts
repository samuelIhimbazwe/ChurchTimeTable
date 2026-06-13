import { ContributionCampaignStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateContributionCampaignDto {
  @IsUUID()
  contributionTypeCatalogId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsNumber()
  @Min(1)
  goalAmount!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  memberGoalAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  familyGoalAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsEnum(ContributionCampaignStatus)
  status?: ContributionCampaignStatus;

  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;
}
