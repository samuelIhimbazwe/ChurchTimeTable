import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  Equals,
} from 'class-validator';
import { ChurchRelationshipType } from '@prisma/client';

export const SIGNUP_INTEREST_OPTIONS = [
  'CHOIR',
  'PROTOCOL',
  'YOUTH',
  'WOMEN',
  'MEN',
  'INTERCESSORS',
  'CHILDREN',
] as const;

export type SignupInterest = (typeof SIGNUP_INTEREST_OPTIONS)[number];

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{9,15}$/, {
    message: 'Phone must be 9–15 digits (optional + prefix)',
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{16}$/, {
    message: 'National ID must be 16 digits',
  })
  nationalId: string;

  @IsBoolean()
  @Equals(true, { message: 'You must accept the terms and conditions' })
  acceptedTerms: boolean;

  @IsOptional()
  @IsEnum(ChurchRelationshipType)
  churchRelationship?: ChurchRelationshipType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsString()
  relationshipNotes?: string;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}
