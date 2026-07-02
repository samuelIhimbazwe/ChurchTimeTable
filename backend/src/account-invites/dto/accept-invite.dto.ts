import { IsBoolean, IsString, MinLength } from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  @MinLength(16)
  token!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsBoolean()
  acceptedTerms!: boolean;
}
