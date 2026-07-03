/**
 * Removes pilot / demo sample data while keeping baseline seed (roles, templates, admin).
 *
 * Run: npm run prisma:clear-pilot
 * Keeps: admin@church.local, church.coord@church.local, system config from seed.ts
 */
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROTECTED_EMAILS = ['admin@church.local', 'church.coord@church.local'];

async function main() {
  const pilotUsers = await prisma.user.findMany({
    where: {
      email: { endsWith: '@church.local' },
      NOT: { email: { in: PROTECTED_EMAILS } },
    },
    select: { id: true, email: true, member: { select: { id: true } } },
  });
  const pilotUserIds = pilotUsers.map((u) => u.id);
  const pilotMemberIds = pilotUsers
    .map((u) => u.member?.id)
    .filter((id): id is string => Boolean(id));

  console.log(`Clearing pilot data (${pilotUsers.length} demo users)…`);

  await prisma.$transaction(async (tx) => {
    await tx.choirSchedulePlanEntry.deleteMany({});
    await tx.choirSchedulePlan.deleteMany({});

    await tx.protocolTeamReport.deleteMany({});
    await tx.protocolTeamAttendance.deleteMany({});
    await tx.protocolOccurrenceTeamMember.deleteMany({});
    await tx.protocolOccurrenceTeamLeader.deleteMany({});
    await tx.protocolOccurrenceTeamBackup.deleteMany({});
    await tx.protocolOccurrenceTeam.deleteMany({});

    await tx.protocolReplacementRequest.deleteMany({});
    await tx.protocolRankingEntry.deleteMany({});
    await tx.protocolCategoryRankingEntry.deleteMany({});
    await tx.protocolMemberBadge.deleteMany({});
    await tx.protocolServiceTeamMember.deleteMany({});
    await tx.protocolServiceTeam.deleteMany({});

    if (pilotMemberIds.length) {
      await tx.protocolTeamLeader.deleteMany({
        where: { memberId: { in: pilotMemberIds } },
      });
      await tx.protocolCommitteeMember.deleteMany({
        where: { memberId: { in: pilotMemberIds } },
      });
      await tx.protocolMemberProfile.deleteMany({
        where: { memberId: { in: pilotMemberIds } },
      });
      await tx.operationalUnitMembership.deleteMany({
        where: { memberId: { in: pilotMemberIds } },
      });
      await tx.ministryMembership.deleteMany({
        where: { memberId: { in: pilotMemberIds } },
      });
      await tx.choirAttendance.deleteMany({
        where: { memberId: { in: pilotMemberIds } },
      });
      await tx.choirCommitteeMember.deleteMany({
        where: { memberId: { in: pilotMemberIds } },
      });
      await tx.familyMember.deleteMany({
        where: { memberId: { in: pilotMemberIds } },
      });
      await tx.memberDues.deleteMany({
        where: { memberId: { in: pilotMemberIds } },
      });
      await tx.memberStatusHistory.deleteMany({
        where: { memberId: { in: pilotMemberIds } },
      });
      await tx.memberProfile.deleteMany({
        where: { memberId: { in: pilotMemberIds } },
      });
    }

    if (pilotUserIds.length) {
      await tx.auditLog.deleteMany({ where: { userId: { in: pilotUserIds } } });
      await tx.importJob.deleteMany({ where: { uploadedById: { in: pilotUserIds } } });
      await tx.notificationDeliveryLog.deleteMany({
        where: { recipientUserId: { in: pilotUserIds } },
      });
      await tx.churchBroadcast.deleteMany({
        where: { createdById: { in: pilotUserIds } },
      });
      await tx.servicePreparationAcknowledgment.deleteMany({
        where: { userId: { in: pilotUserIds } },
      });
      await tx.passwordResetToken.deleteMany({
        where: { userId: { in: pilotUserIds } },
      });
      await tx.uxAnalyticsEvent.deleteMany({
        where: { userId: { in: pilotUserIds } },
      });
      await tx.accountInvite.deleteMany({
        where: { invitedByUserId: { in: pilotUserIds } },
      });
    }

    await tx.choirServiceAssignment.deleteMany({});
    await tx.contributionRecord.deleteMany({});
    await tx.contributionAdjustment.deleteMany({});

    await tx.operationAssignment.deleteMany({});
    await tx.operationOccurrence.deleteMany({});

    await tx.songAsset.deleteMany({
      where: { songId: { startsWith: 'pilot-' } },
    });
    await tx.song.deleteMany({
      where: { id: { startsWith: 'pilot-' } },
    });

    await tx.familyMember.deleteMany({
      where: {
        family: { familyCode: { in: ['PILOT-A', 'PILOT-B'] } },
      },
    });
    await tx.family.deleteMany({
      where: { familyCode: { in: ['PILOT-A', 'PILOT-B'] } },
    });

    await tx.choirMembership.deleteMany({
      where: { userId: { in: pilotUserIds } },
    });
    await tx.choirJoinRequest.deleteMany({
      where: { memberId: { in: pilotMemberIds } },
    });
    await tx.choirSponsorRequest.deleteMany({
      where: { memberId: { in: pilotMemberIds } },
    });
    await tx.choirSponsorship.deleteMany({
      where: { memberId: { in: pilotMemberIds } },
    });

    await tx.protocolMembershipClaim.deleteMany({});
    await tx.protocolInvitation.deleteMany({});

    await tx.notification.deleteMany({
      where: { userId: { in: pilotUserIds } },
    });

    if (pilotUserIds.length) {
      await tx.userRole.deleteMany({ where: { userId: { in: pilotUserIds } } });
      await tx.user.deleteMany({ where: { id: { in: pilotUserIds } } });
    }

    const config = await tx.churchConfiguration.findUnique({ where: { id: 'default' } });
    const churchInfo = { ...((config?.churchInfo ?? {}) as Record<string, unknown>) };
    delete churchInfo.giving;
    await tx.churchConfiguration.update({
      where: { id: 'default' },
      data: {
        demoModeEnabled: false,
        churchInfo: churchInfo as Prisma.InputJsonValue,
      },
    });

    await tx.memberNumberSequence.updateMany({
      data: { nextValue: 1 },
    });
  });

  console.log('Pilot demo data cleared.');
  console.log('Kept:', PROTECTED_EMAILS.join(', '));
  console.log('demoModeEnabled is now false.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
