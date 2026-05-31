import {
  IsOptional,
  IsString,
  Length,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isRwandaPhone', async: false })
export class IsRwandaPhoneConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === undefined || value === null || value === '') {
      return true;
    }
    if (typeof value !== 'string') {
      return false;
    }
    const normalized = value.replace(/\s+/g, '');
    return /^(?:\+250|250|0)?7[0-9]{8}$/.test(normalized);
  }

  defaultMessage(): string {
    return 'INVALID_PHONE_FORMAT';
  }
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Validate(IsRwandaPhoneConstraint)
  phone?: string;
}
