'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { contributionsApi, financeApi } from '@/lib/api'
import { Card, Badge, PermissionGate } from '@/components/shared'
import { MinistryContributionPendingInbox } from '@/components/shared/finance/MinistryContributionPendingInbox'
import { ContributionAdjustModal } from '@/components/shared/finance/ContributionAdjustModal'
import {
  normalizeContributionList,
  type TreasuryContributionRow,
} from '@/components/shared/finance/contribution-inbox.shared'
import { formatCurrency, formatDate } from '@/lib/utils/format'

const PROTOCOL_INBOX_KEYS = [
  'protocol-contribution-inbox',
  'finance-contributions-protocol',
] as const

export function ProtocolContributionTreasuryPanel() {
  const [adjusting, setAdjusting] = useState<TreasuryContributionRow | null>(null)

  const { data: allRaw, isLoading: loadingAll } = useQuery({
    queryKey: ['finance-contributions-protocol'],
    queryFn: () => financeApi.listContributions({ ministryScope: 'PROTOCOL', limit: 80 }),
  })

  const all = normalizeContributionList(allRaw)
  const confirmed = all.filter((c) => c.status === 'CONFIRMED')

  return (
    <>
      <div className="space-y-4">
        <PermissionGate anyOf={['protocol.finance.approve', 'protocol.finance.manage']}>
          <MinistryContributionPendingInbox
            title="Pending treasurer confirmation"
            description="Members submit directly — you confirm payment received on MoMo/bank."
            queryKey={['protocol-contribution-inbox']}
            queryFn={() => contributionsApi.getProtocolInbox({ status: 'SUBMITTED' })}
            reviewModalTitle="Review protocol contribution"
            invalidateQueryKeys={[...PROTOCOL_INBOX_KEYS]}
            emptyMessage="No pending claims."
          />
        </PermissionGate>

        <PermissionGate
          anyOf={[
            'protocol.contribution.view.all',
            'protocol.finance.view',
            'protocol.finance.manage',
            'protocol.contribution.adjust',
          ]}
        >
          <Card padding="md">
            <p className="font-semibold mb-2">All protocol contributions</p>
            {loadingAll ? (
              <p className="text-sm text-text-muted">Loading…</p>
            ) : all.length === 0 ? (
              <p className="text-sm text-text-muted">No records yet.</p>
            ) : (
              <ul className="divide-y divide-border max-h-96 overflow-y-auto">
                {all.map((item) => (
                  <li key={item.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{item.memberName ?? 'Member'}</p>
                      <p className="text-xs text-text-muted">
                        {formatCurrency(item.claimedAmount)}
                        {item.confirmedAmount != null && (
                          <> · confirmed {formatCurrency(item.confirmedAmount)}</>
                        )}
                        {item.paymentAt && <> · {formatDate(item.paymentAt)}</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          item.status === 'CONFIRMED'
                            ? 'status-present'
                            : item.status === 'SUBMITTED'
                              ? 'status-pending'
                              : 'default'
                        }
                      >
                        {item.status}
                      </Badge>
                      {item.status === 'CONFIRMED' && (
                        <PermissionGate
                          anyOf={['protocol.contribution.adjust', 'protocol.finance.manage']}
                        >
                          <button
                            type="button"
                            onClick={() => setAdjusting(item)}
                            className="text-xs font-semibold text-primary-600"
                          >
                            Adjust
                          </button>
                        </PermissionGate>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-text-muted mt-3">
              {confirmed.length} confirmed · list refreshes after each confirmation
            </p>
          </Card>
        </PermissionGate>
      </div>

      {adjusting && (
        <ContributionAdjustModal
          item={adjusting}
          onClose={() => setAdjusting(null)}
          invalidateQueryKeys={[...PROTOCOL_INBOX_KEYS]}
        />
      )}
    </>
  )
}
