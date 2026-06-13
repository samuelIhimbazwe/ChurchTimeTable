import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CloseTreasuryPeriodDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be YYYY-MM' })
  month?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
