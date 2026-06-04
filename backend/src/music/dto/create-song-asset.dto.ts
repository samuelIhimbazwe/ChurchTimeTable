import { IsEnum, IsInt, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';
import { SongAssetType } from '@prisma/client';

export class CreateSongAssetDto {
  @IsEnum(SongAssetType)
  assetType: SongAssetType;

  @IsString()
  @MinLength(1)
  fileName: string;

  @IsString()
  @IsUrl()
  fileUrl: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  fileSize?: number;
}
