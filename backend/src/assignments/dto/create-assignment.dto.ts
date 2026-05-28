import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAssignmentDto {
  @IsUUID()
  eventId: string;

  @IsUUID()
  memberId: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsBoolean()
  isOverride?: boolean;

  @IsOptional()
  @IsString()
  overrideReason?: string;
}
