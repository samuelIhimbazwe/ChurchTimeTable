import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { WelfareCaseStatus, WelfareUrgency } from '@prisma/client';

export class UpdateWelfareCaseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @IsEnum(WelfareCaseStatus)
  status?: WelfareCaseStatus;

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
