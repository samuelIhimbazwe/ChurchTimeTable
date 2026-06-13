import { Test, TestingModule } from '@nestjs/testing';

import { FamilyMemberRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { NotificationsService } from '../notifications/notifications.service';

import { ContributionActionTokenService } from './contribution-action-token.service';

import { ContributionSmsChannel } from './contribution-sms.channel';

import { ContributionWorkflowNotificationsService } from './contribution-workflow-notifications.service';



describe('ContributionWorkflowNotificationsService', () => {

  let service: ContributionWorkflowNotificationsService;



  const prisma = {

    family: { findUnique: jest.fn() },

    familyMember: { findMany: jest.fn() },

    notification: { findMany: jest.fn() },

    user: { findUnique: jest.fn() },

  };



  const notifications = { create: jest.fn() };

  const actionTokens = {

    createApproveToken: jest.fn().mockReturnValue('signed-token'),

    buildQuickActionUrl: jest

      .fn()

      .mockReturnValue('http://localhost:3001/choir/c1/family-leadership/quick-action?token=signed-token'),

  };

  const sms = { sendApprovalReminder: jest.fn() };



  beforeEach(async () => {

    const module: TestingModule = await Test.createTestingModule({

      providers: [

        ContributionWorkflowNotificationsService,

        { provide: PrismaService, useValue: prisma },

        { provide: NotificationsService, useValue: notifications },

        { provide: ContributionActionTokenService, useValue: actionTokens },

        { provide: ContributionSmsChannel, useValue: sms },

      ],

    }).compile();



    service = module.get(ContributionWorkflowNotificationsService);

    jest.clearAllMocks();

    prisma.notification.findMany.mockResolvedValue([]);

    prisma.user.findUnique.mockResolvedValue(null);

    notifications.create.mockResolvedValue({ id: 'n1' });

  });



  it('notifies family head when pending claims are aging', async () => {

    prisma.family.findUnique.mockResolvedValue({

      familyName: 'Pilot Family',

      choirId: 'choir-1',

      delegationEnabled: false,

    });

    prisma.familyMember.findMany.mockResolvedValue([

      {

        role: FamilyMemberRole.HEAD,

        member: { userId: 'head-user' },

      },

    ]);



    await service.evaluateFamilyDashboard({

      familyId: 'fam-1',

      pendingCount: 4,

      oldestPendingHours: 50,

      oldestPendingContributionId: 'claim-1',

      behindCount: 0,

    });



    expect(notifications.create).toHaveBeenCalledWith(

      'head-user',

      expect.anything(),

      'Pending claims need attention',

      expect.stringContaining('4 contribution claims'),

      expect.objectContaining({

        kind: 'family_pending_aging',

        familyId: 'fam-1',

        actionUrl: expect.stringContaining('quick-action'),

      }),

      'choir-1',

    );

  });



  it('skips duplicate notifications within dedupe window', async () => {

    prisma.notification.findMany.mockResolvedValue([

      {

        data: { kind: 'family_pending_aging', familyId: 'fam-1' },

      },

    ]);

    prisma.family.findUnique.mockResolvedValue({

      familyName: 'Pilot Family',

      choirId: 'choir-1',

      delegationEnabled: false,

    });

    prisma.familyMember.findMany.mockResolvedValue([

      {

        role: FamilyMemberRole.HEAD,

        member: { userId: 'head-user' },

      },

    ]);



    await service.evaluateFamilyDashboard({

      familyId: 'fam-1',

      pendingCount: 4,

      oldestPendingHours: 50,

      oldestPendingContributionId: 'claim-1',

      behindCount: 0,

    });



    expect(notifications.create).not.toHaveBeenCalled();

  });

});

