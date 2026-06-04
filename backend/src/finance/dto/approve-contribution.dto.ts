import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class ApproveContributionDto {
  @IsNumber()
  @Min(0.01)
  confirmedAmount: number;

  @IsOptional()
  @IsString()
  @MinLength(3)
  discrepancyReason?: string;
}
