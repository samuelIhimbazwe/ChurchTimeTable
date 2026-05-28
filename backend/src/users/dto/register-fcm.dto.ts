import { IsString, MinLength } from 'class-validator';

export class RegisterFcmDto {
  @IsString()
  @MinLength(10)
  token: string;
}
