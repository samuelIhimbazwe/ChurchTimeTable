import { AssetAssignmentTargetType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateAssetAssignmentDto {
  @IsEnum(AssetAssignmentTargetType)
  assignedToType: AssetAssignmentTargetType;

  @IsString()
  assignedToId: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  expectedReturnAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
