import { IsString } from 'class-validator';

export class DeactivateChoirMemberDto {
  @IsString()
  choirId!: string;

  @IsString()
  memberId!: string;
}
