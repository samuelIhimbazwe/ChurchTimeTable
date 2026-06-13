import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class QuickActionApproveDto {
  @IsString()
  @MinLength(10)
  token!: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  confirmedAmount?: number;

  @IsOptional()
  @IsString()
  @MinLength(3)
  discrepancyReason?: string;
}

export class QuickActionPreviewQueryDto {
  @IsString()
  @MinLength(10)
  token!: string;
}
