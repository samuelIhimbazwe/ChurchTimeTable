import { IsOptional, IsUUID } from 'class-validator';

export class FamilyDashboardQueryDto {
  @IsOptional()
  @IsUUID()
  familyId?: string;

  @IsOptional()
  @IsUUID()
  campaignId?: string;
}
