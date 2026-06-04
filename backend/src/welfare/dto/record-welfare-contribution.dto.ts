import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class RecordWelfareContributionDto {
  @IsOptional()
  @IsUUID()
  caseId?: string;

  @IsUUID()
  contributorId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  paymentChannel?: string;

  @IsOptional()
  @IsString()
  paymentAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  isAnonymous?: boolean;

  @IsOptional()
  @IsString()
  receiptUrl?: string;
}
