import { IsString, MinLength } from 'class-validator';

export class RejectFamilyContributionDto {
  @IsString()
  @MinLength(3)
  rejectionReason: string;
}
