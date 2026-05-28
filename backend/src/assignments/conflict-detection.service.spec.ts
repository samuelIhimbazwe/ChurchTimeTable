import { Test, TestingModule } from '@nestjs/testing';
import { ConflictDetectionService } from './conflict-detection.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ConflictDetectionService', () => {
  let service: ConflictDetectionService;
  const prisma = {
    event: { findUniqueOrThrow: jest.fn() },
    member: { findUniqueOrThrow: jest.fn() },
    eventAssignment: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConflictDetectionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ConflictDetectionService);
    jest.clearAllMocks();
  });

  it('rejects ministry conflict', async () => {
    prisma.event.findUniqueOrThrow.mockResolvedValue({
      id: 'e1',
      ministryScope: 'PROTOCOL',
      type: 'PROTOCOL_SERVICE',
      startTime: new Date(),
      endTime: new Date(),
      serviceSlot: null,
    });
    prisma.member.findUniqueOrThrow.mockResolvedValue({
      id: 'm1',
      ministry: 'CHOIR',
      isChildrenChoir: false,
    });

    await expect(
      service.validateAssignment({ eventId: 'e1', memberId: 'm1' }),
    ).rejects.toMatchObject({ status: 409 });
  });
});
