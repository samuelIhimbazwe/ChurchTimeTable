import { IsArray, IsIn, IsString } from 'class-validator';

export class AssignSystemUserRolesDto {
  @IsArray()
  @IsString({ each: true })
  roleNames!: string[];

  @IsIn(['replace', 'add'])
  mode: 'replace' | 'add' = 'replace';
}
