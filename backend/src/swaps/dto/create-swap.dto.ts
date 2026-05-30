import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CoverageOperationalType } from '@prisma/client';

export class CreateSwapDto {
  @IsUUID()
  eventId: string;

  @IsUUID()
  targetId: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(CoverageOperationalType)
  coverageType?: CoverageOperationalType;
}
