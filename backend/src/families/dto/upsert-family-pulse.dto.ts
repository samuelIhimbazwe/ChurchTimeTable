import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpsertFamilyPulseDto {
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsString()
  weekStart?: string;
}
