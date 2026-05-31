import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectContributionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
