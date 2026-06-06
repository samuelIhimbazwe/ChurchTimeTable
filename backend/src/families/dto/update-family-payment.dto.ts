import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateFamilyPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  paymentMomoNumber?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  paymentMomoAccountName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  paymentBankAccount?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  paymentBankName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  paymentInstructions?: string | null;
}
