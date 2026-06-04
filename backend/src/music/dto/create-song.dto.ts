import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateSongDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  alternateTitle?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  composer?: string;

  @IsOptional()
  @IsString()
  arranger?: string;

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  copyrightInfo?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  scriptureReference?: string;

  @IsOptional()
  @IsString()
  lyricsText?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
