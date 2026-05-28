import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const SERVICE_TYPES = ['SERVICE_1', 'SERVICE_2', 'TUESDAY', 'IGABURO'] as const;

export class GenerateProtocolTeamsDto {
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @IsEnum(SERVICE_TYPES)
  serviceType: (typeof SERVICE_TYPES)[number];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  teamCount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredTeamHeadIds?: string[];

  @IsOptional()
  @IsString()
  overrideReason?: string;
}
