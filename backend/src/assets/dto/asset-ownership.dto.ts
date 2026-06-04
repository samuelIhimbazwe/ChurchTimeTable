import { AssetOwnerType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class AddAssetOwnerDto {
  @IsEnum(AssetOwnerType)
  ownerType: AssetOwnerType;

  @IsString()
  ownerId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ownershipPercentage?: number;

  @IsOptional()
  @IsNumber()
  contributedAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAssetOwnerDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ownershipPercentage?: number;

  @IsOptional()
  @IsNumber()
  contributedAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
