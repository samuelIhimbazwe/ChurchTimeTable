import { IsIn } from 'class-validator';

export class UpdateLanguageDto {
  @IsIn(['rw', 'en', 'fr'])
  preferredLanguage: 'rw' | 'en' | 'fr';
}
