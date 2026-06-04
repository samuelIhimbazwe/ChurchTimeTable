import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class ChangeContributionCampaignDto {
  @IsOptional()
  @IsUUID()
  contributionCampaignId?: string | null;

  @IsString()
  @MinLength(3)
  reason!: string;
}
