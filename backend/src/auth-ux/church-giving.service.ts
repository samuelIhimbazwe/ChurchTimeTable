import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ChurchGivingPaymentBox = {
  momoNumber: string | null;
  momoAccountName: string | null;
  bankAccount: string | null;
  bankName: string | null;
  instructions: string | null;
};

export type ChurchGivingSettings = {
  tithesOfferings: ChurchGivingPaymentBox;
  inyubako: ChurchGivingPaymentBox;
};

const DEFAULT_TITHES: ChurchGivingPaymentBox = {
  momoNumber: null,
  momoAccountName: null,
  bankAccount: null,
  bankName: null,
  instructions:
    'Tithes and offerings — use the church MoMo code below. Include your name in the payment note.',
};

const DEFAULT_INYUBAKO: ChurchGivingPaymentBox = {
  momoNumber: null,
  momoAccountName: null,
  bankAccount: null,
  bankName: null,
  instructions:
    'Inyubako (church building fund) — MoMo or bank transfer. Reference "Inyubako" in the note.',
};

const DEFAULT_PROTOCOL_TREASURY: ChurchGivingPaymentBox = {
  momoNumber: null,
  momoAccountName: null,
  bankAccount: null,
  bankName: null,
  instructions:
    'Protocol unity contributions — pay to the protocol MoMo below, then submit your claim for treasurer confirmation.',
};

const DEFAULT_GIVING: ChurchGivingSettings = {
  tithesOfferings: DEFAULT_TITHES,
  inyubako: DEFAULT_INYUBAKO,
};

function parsePaymentBox(
  raw: Record<string, unknown> | undefined,
  fallback: ChurchGivingPaymentBox,
): ChurchGivingPaymentBox {
  if (!raw || typeof raw !== 'object') return fallback;
  const str = (key: string) => {
    const v = raw[key];
    return typeof v === 'string' && v.trim() ? v.trim() : null;
  };
  return {
    momoNumber: str('momoNumber') ?? fallback.momoNumber,
    momoAccountName: str('momoAccountName') ?? fallback.momoAccountName,
    bankAccount: str('bankAccount') ?? fallback.bankAccount,
    bankName: str('bankName') ?? fallback.bankName,
    instructions: str('instructions') ?? fallback.instructions,
  };
}

@Injectable()
export class ChurchGivingService {
  constructor(private prisma: PrismaService) {}

  async getPublicGiving(): Promise<ChurchGivingSettings> {
    const config = await this.prisma.churchConfiguration.findUnique({
      where: { id: 'default' },
    });
    const info = (config?.churchInfo ?? {}) as Record<string, unknown>;
    const giving = (info.giving ?? {}) as Record<string, unknown>;
    const tithesRaw = giving.tithesOfferings as Record<string, unknown> | undefined;
    const inyubakoRaw = giving.inyubako as Record<string, unknown> | undefined;

    return {
      tithesOfferings: parsePaymentBox(tithesRaw, DEFAULT_TITHES),
      inyubako: parsePaymentBox(inyubakoRaw, DEFAULT_INYUBAKO),
    };
  }

  async updateGiving(
    actorUserId: string,
    data: Partial<{
      tithesOfferings: Partial<ChurchGivingPaymentBox>;
      inyubako: Partial<ChurchGivingPaymentBox>;
    }>,
  ) {
    void actorUserId;
    const existing = await this.prisma.churchConfiguration.findUnique({
      where: { id: 'default' },
    });
    const info = (existing?.churchInfo ?? {}) as Record<string, unknown>;
    const giving = (info.giving ?? {}) as Record<string, unknown>;
    const tithes = (giving.tithesOfferings ?? {}) as Record<string, unknown>;
    const inyubako = (giving.inyubako ?? {}) as Record<string, unknown>;

    const mergeBox = (
      current: Record<string, unknown>,
      patch?: Partial<ChurchGivingPaymentBox>,
    ) => ({
      ...current,
      ...(patch?.momoNumber !== undefined ? { momoNumber: patch.momoNumber } : {}),
      ...(patch?.momoAccountName !== undefined
        ? { momoAccountName: patch.momoAccountName }
        : {}),
      ...(patch?.bankAccount !== undefined ? { bankAccount: patch.bankAccount } : {}),
      ...(patch?.bankName !== undefined ? { bankName: patch.bankName } : {}),
      ...(patch?.instructions !== undefined ? { instructions: patch.instructions } : {}),
    });

    const nextGiving = {
      ...giving,
      tithesOfferings: mergeBox(tithes, data.tithesOfferings),
      inyubako: mergeBox(inyubako, data.inyubako),
    };

    await this.prisma.churchConfiguration.upsert({
      where: { id: 'default' },
      create: { id: 'default', churchInfo: { ...info, giving: nextGiving } },
      update: { churchInfo: { ...info, giving: nextGiving } },
    });

    return this.getPublicGiving();
  }

  async getProtocolTreasuryPayment(): Promise<ChurchGivingPaymentBox> {
    const config = await this.prisma.churchConfiguration.findUnique({
      where: { id: 'default' },
    });
    const info = (config?.churchInfo ?? {}) as Record<string, unknown>;
    const giving = (info.giving ?? {}) as Record<string, unknown>;
    const protocolRaw = giving.protocolTreasury as Record<string, unknown> | undefined;
    return parsePaymentBox(protocolRaw, DEFAULT_PROTOCOL_TREASURY);
  }
}
