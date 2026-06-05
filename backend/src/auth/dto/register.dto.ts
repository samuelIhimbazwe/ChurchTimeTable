import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
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
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

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
