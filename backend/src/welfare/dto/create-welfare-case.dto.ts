import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { WelfareCaseStatus, WelfareUrgency } from '@prisma/client';

export class CreateWelfareCaseDto {
  @IsUUID()
  memberId: string;

  @IsOptional()
  @IsUUID()
  familyId?: string;

  @IsUUID()
  categoryId: string;

  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(3)
  description: string;

  @IsOptional()
  @IsEnum(WelfareUrgency)
  urgency?: WelfareUrgency;

  @IsOptional()
  @IsUUID()
  coordinatorId?: string;

  @IsOptional()
  @IsString()
  supportPlan?: string;

  @IsOptional()
  @IsEnum(WelfareCaseStatus)
  status?: WelfareCaseStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  requestedAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedAmount?: number;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentUrls?: string[];
}
