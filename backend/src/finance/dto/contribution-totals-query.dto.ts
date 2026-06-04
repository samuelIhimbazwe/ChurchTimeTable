import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class ContributionTotalsQueryDto {
  @IsOptional()
  @IsIn(['own', 'family', 'choir'])
  scope?: 'own' | 'family' | 'choir';

  @IsOptional()
  @IsUUID()
  familyId?: string;

  @IsOptional()
  @IsUUID()
  contributionTypeCatalogId?: string;

  @IsOptional()
  @IsUUID()
  contributionCampaignId?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeArchived?: boolean;
}
