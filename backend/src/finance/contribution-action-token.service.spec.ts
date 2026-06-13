import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ContributionActionTokenService } from './contribution-action-token.service';

describe('ContributionActionTokenService', () => {
  let service: ContributionActionTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContributionActionTokenService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('token-abc'),
            verify: jest.fn().mockReturnValue({
              sub: 'user-1',
              cid: 'claim-1',
              act: 'approve',
              choirId: 'choir-1',
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-secret') },
        },
      ],
    }).compile();

    service = module.get(ContributionActionTokenService);
  });

  it('builds quick action URLs for mobile approve links', () => {
    const url = service.buildQuickActionUrl('choir-1', 'token-abc');
    expect(url).toContain('/choir/choir-1/family-leadership/quick-action');
    expect(url).toContain('token=token-abc');
  });

  it('verifies approve tokens', () => {
    const payload = service.verifyApproveToken('token-abc');
    expect(payload).toEqual({
      userId: 'user-1',
      contributionId: 'claim-1',
      choirId: 'choir-1',
    });
  });
});
