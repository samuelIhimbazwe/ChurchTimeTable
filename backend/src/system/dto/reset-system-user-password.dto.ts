import { IsString, MinLength } from 'class-validator';

export class ResetSystemUserPasswordDto {
  @IsString()
  @MinLength(8)
  password!: string;
}
