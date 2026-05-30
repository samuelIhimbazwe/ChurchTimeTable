import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { DueType, MinistryScope } from '@prisma/client';

export class UpsertMemberDuesDto {
  @IsUUID()
  memberId: string;

  @IsString()
  period: string;

  @IsEnum(MinistryScope)
  ministryScope: MinistryScope;

  @IsEnum(DueType)
  dueType: DueType;

  @IsNumber()
  @Min(0)
  amountDue: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number;

  @IsOptional()
  @IsString()
  waivedReason?: string;
}
