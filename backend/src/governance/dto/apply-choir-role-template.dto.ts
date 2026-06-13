import { IsOptional, IsString } from 'class-validator';

export class ApplyChoirRoleTemplateDto {
  @IsString()
  scopeId!: string;

  @IsOptional()
  @IsString()
  roleName?: string;
}
