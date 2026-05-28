import { IsDateString, IsNumber, IsString, Min } from 'class-validator';

export class CreateBudgetDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;
}
