import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { MinistryScope } from '@prisma/client';

export class CreateDisciplineDto {
  @IsUUID()
  memberId: string;

  @IsEnum(MinistryScope)
  ministry: MinistryScope;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsUUID()
  reporterId?: string;
}
