import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { WelfareAssistanceType } from '@prisma/client';

export class RecordWelfareAssistanceDto {
  @IsUUID()
  caseId: string;

  @IsEnum(WelfareAssistanceType)
  assistanceType: WelfareAssistanceType;

  @IsString()
  @MinLength(3)
  description: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  deliveredAt?: string;
}
