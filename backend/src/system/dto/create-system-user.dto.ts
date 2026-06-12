import {
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateSystemUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(['CHOIR', 'PROTOCOL', 'BOTH'])
  ministry?: 'CHOIR' | 'PROTOCOL' | 'BOTH';

  @IsArray()
  @IsString({ each: true })
  roleNames!: string[];

  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}
