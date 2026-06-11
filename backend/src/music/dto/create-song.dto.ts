import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ListenLinkDto {
  @IsString()
  platform!: string;

  @IsString()
  url!: string;
}

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
  lyricist?: string;

  @IsOptional()
  @IsString()
  composer?: string;

  @IsOptional()
  @IsString()
  arranger?: string;

  @IsOptional()
  @IsString()
  conductedBy?: string;

  @IsOptional()
  @IsString()
  producedBy?: string;

  @IsOptional()
  @IsString()
  performedBy?: string;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  voiceParts?: string;

  @IsOptional()
  @IsInt()
  durationSeconds?: number;

  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @IsOptional()
  @IsString()
  shortSummary?: string;

  @IsOptional()
  @IsString()
  fullDescription?: string;

  @IsOptional()
  @IsString()
  recordingStudio?: string;

  @IsOptional()
  @IsString()
  mixingEngineer?: string;

  @IsOptional()
  @IsString()
  masteringBy?: string;

  @IsOptional()
  @IsString()
  recordingType?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListenLinkDto)
  listenLinks?: ListenLinkDto[];

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
