import { IsArray, IsOptional, IsString } from 'class-validator';

export class ChoirSodCheckDto {
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];

  @IsOptional()
  @IsString()
  roleName?: string;
}
