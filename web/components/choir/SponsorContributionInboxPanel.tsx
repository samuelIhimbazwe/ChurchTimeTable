'use client'

import { contributionsApi } from '@/lib/api'
import { Badge } from '@/components/shared'
import { MinistryContributionPendingInbox } from '@/components/shared/finance/MinistryContributionPendingInbox'

type Props = {
  choirId: string
}

const SPONSOR_INBOX_KEYS = [
  'sponsor-contribution-inbox',
  'finance-contributions-all',
  'my-contributions',
] as const

export function SponsorContributionInboxPanel({ choirId }: Props) {
  return (
    <MinistryContributionPendingInbox
      title="Sponsor gifts inbox"
      description="Sponsors are not choir singers and have no family — their gifts come here for treasurer confirmation, not the family-head inbox."
      queryKey={['sponsor-contribution-inbox', choirId]}
      queryFn={() => contributionsApi.getSponsorInbox({ choirId, status: 'SUBMITTED' })}
      enabled={!!choirId}
      reviewModalTitle="Confirm sponsor gift"
      confirmLabel="Confirm payment"
      successConfirmMessage="Sponsor gift confirmed"
      successRejectMessage="Sponsor claim rejected"
      invalidateQueryKeys={[...SPONSOR_INBOX_KEYS]}
      emptyMessage="No pending sponsor gifts."
      showPaymentDate
      rowBadge={() => <Badge variant="default" className="text-[10px]">Sponsor</Badge>}
    />
  )
}
