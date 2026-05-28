import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpsertCommitteeRoleDto {
  @IsString()
  scopeId: string;

  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @IsOptional()
  @IsString()
  description?: string;
}
