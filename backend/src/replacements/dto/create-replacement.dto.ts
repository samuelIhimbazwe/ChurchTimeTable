import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReplacementKind } from '@prisma/client';

export class CreateReplacementDto {
  @IsUUID()
  eventId: string;

  @IsUUID()
  absentMemberId: string;

  @IsOptional()
  @IsUUID()
  coverMemberId?: string;

  @IsOptional()
  @IsBoolean()
  selfFound?: boolean;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(ReplacementKind)
  kind?: ReplacementKind;
}
