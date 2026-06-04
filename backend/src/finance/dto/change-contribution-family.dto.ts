import { IsString, IsUUID, MinLength } from 'class-validator';

export class ChangeContributionFamilyDto {
  @IsUUID()
  newFamilyId!: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
