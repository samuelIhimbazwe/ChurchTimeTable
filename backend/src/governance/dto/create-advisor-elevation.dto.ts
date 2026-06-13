import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAdvisorElevationDto {
  @IsString()
  scopeId!: string;

  @IsString()
  memberId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissions!: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  durationDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
