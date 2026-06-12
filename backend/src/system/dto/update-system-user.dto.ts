import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateSystemUserDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}
