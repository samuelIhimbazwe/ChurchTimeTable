import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { BudgetKind, MinistryScope } from '@prisma/client';

export class CreateBudgetDto {
  @IsEnum(MinistryScope)
  ministryScope: MinistryScope;

  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(BudgetKind)
  kind?: BudgetKind;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;

  @IsOptional()
  @IsUUID()
  relatedEventId?: string;
}
