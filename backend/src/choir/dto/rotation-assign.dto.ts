import { IsInt, IsOptional, Min } from 'class-validator';

export class RotationAssignDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  count?: number;
}
