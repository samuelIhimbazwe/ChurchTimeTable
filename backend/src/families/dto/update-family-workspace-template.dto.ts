import { IsIn, IsString } from 'class-validator';

export const FAMILY_WORKSPACE_TEMPLATES = [
  'DEFAULT',
  'DECISIONS_FIRST',
  'TEAM_HEALTH',
] as const;

export type FamilyWorkspaceTemplate =
  (typeof FAMILY_WORKSPACE_TEMPLATES)[number];

export class UpdateFamilyWorkspaceTemplateDto {
  @IsString()
  @IsIn(FAMILY_WORKSPACE_TEMPLATES)
  workspaceTemplate!: FamilyWorkspaceTemplate;
}
