import { IsString, IsUUID, MinLength } from 'class-validator';

export class ChangeContributionTypeDto {
  @IsUUID()
  contributionTypeCatalogId!: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
