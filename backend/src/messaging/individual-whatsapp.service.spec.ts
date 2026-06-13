import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AppLinkService } from './app-link.service';
import { IndividualWhatsAppService } from './individual-whatsapp.service';
import { WhatsAppOutboundService } from './whatsapp-outbound.service';

describe('IndividualWhatsAppService', () => {
  let service: IndividualWhatsAppService;
  const whatsapp = { send: jest.fn().mockResolvedValue({ sent: false, skippedReason: 'whatsapp_disabled' }) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndividualWhatsAppService,
        AppLinkService,
        { provide: WhatsAppOutboundService, useValue: whatsapp },
        { provide: PrismaService, useValue: { user: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]) } } },
      ],
    }).compile();

    service = module.get(IndividualWhatsAppService);
    jest.clearAllMocks();
  });

  it('builds thank-you message with portal link', async () => {
    await service.sendThankYou({
      phone: '0788123456',
      memberName: 'Jean',
      amount: 5000,
      currency: 'RWF',
      referenceNumber: 'REF-001',
    });

    expect(whatsapp.send).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '0788123456',
        body: expect.stringContaining('/portal/contributions'),
      }),
    );
  });
});
