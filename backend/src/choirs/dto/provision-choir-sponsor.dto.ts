import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ProvisionChoirSponsorDto {
  @IsString()
  @MinLength(1)
  choirId!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
