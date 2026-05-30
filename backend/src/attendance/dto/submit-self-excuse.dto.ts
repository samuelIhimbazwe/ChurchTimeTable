import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SubmitSelfExcuseDto {
  @IsUUID()
  eventId: string;

  @IsString()
  reasonType: string;

  @IsOptional()
  @IsString()
  excuseReason?: string;

  @IsOptional()
  @IsString()
  excuseEvidenceUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
