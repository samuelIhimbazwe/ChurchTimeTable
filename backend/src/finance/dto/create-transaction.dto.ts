import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { FinanceCategory, MinistryScope, TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsEnum(MinistryScope)
  ministryScope: MinistryScope;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(FinanceCategory)
  category: FinanceCategory;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  memberId?: string;

  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @IsOptional()
  @IsUUID()
  relatedEventId?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}
