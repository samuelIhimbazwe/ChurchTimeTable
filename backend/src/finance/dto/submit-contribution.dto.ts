import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentChannel } from '@prisma/client';

export class SubmitContributionDto {
  @IsUUID()
  contributionTypeCatalogId: string;

  @IsOptional()
  @IsUUID()
  contributionCampaignId?: string;

  @IsNumber()
  @Min(0.01)
  claimedAmount: number;

  @IsDateString()
  paymentAt: string;

  @IsEnum(PaymentChannel)
  paymentChannel: PaymentChannel;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  receiptUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  /** Required when contribution type catalog code is `other` */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  customTypeLabel?: string;

  /** Required for sponsor giving when the member is not in a choir family */
  @IsOptional()
  @IsUUID()
  choirId?: string;
}
