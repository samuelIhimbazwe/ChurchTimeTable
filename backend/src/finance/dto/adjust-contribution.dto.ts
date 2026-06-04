import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ContributionAdjustmentCategory } from '@prisma/client';

export class AdjustContributionDto {
  @IsNumber()
  adjustmentAmount: number;

  @IsEnum(ContributionAdjustmentCategory)
  category: ContributionAdjustmentCategory;

  @IsString()
  @MinLength(3)
  reason: string;

  @IsOptional()
  @IsUUID()
  referenceContributionId?: string;
}
