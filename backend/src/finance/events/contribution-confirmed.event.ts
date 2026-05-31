import type { ContributionType } from '@prisma/client';

/** Hook payload for Sprint F thank-you / notification workflows. */
export class ContributionConfirmedEvent {
  constructor(
    public readonly contributionId: string,
    public readonly memberId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly contributionType: ContributionType,
    public readonly referenceNumber: string,
    public readonly financeTransactionId: string | null,
  ) {}
}
