import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AssetCondition,
  AssetStatus,
  MemberGender,
  UniformAssetStatus,
} from '@prisma/client';

class UniformProfileDto {
  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsEnum(MemberGender)
  gender?: MemberGender;

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsEnum(UniformAssetStatus)
  status?: UniformAssetStatus;
}

class InstrumentProfileDto {
  @IsString()
  @MinLength(1)
  instrumentType: string;

  @IsOptional()
  @IsString()
  tuningNotes?: string;

  @IsOptional()
  @IsNumber()
  maintenanceIntervalDays?: number;
}

export class CreateAssetDto {
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  code: string;

  @IsString()
  @MinLength(2)
  @MaxLength(256)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @IsOptional()
  @IsEnum(AssetCondition)
  condition?: AssetCondition;

  @IsOptional()
  @IsString()
  purchaseDate?: string;

  @IsOptional()
  @IsNumber()
  purchaseValue?: number;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UniformProfileDto)
  uniformProfile?: UniformProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => InstrumentProfileDto)
  instrumentProfile?: InstrumentProfileDto;
}
