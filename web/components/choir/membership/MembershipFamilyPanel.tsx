'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api'
import { Card, SkeletonCard, Badge } from '@/components/shared'
import { FamilyPaymentInstructionsCard } from '@/components/choir/FamilyPaymentInstructionsCard'
import { membershipProfilePath } from '@/lib/choir/membership-office'
import { DollarSign, Users } from 'lucide-react'

type Props = { choirId: string }

export function MembershipFamilyPanel({ choirId }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['choir-my-family', choirId],
    queryFn: () => memberPortalApi.getChoirMyFamily(choirId),
  })

  const family = data?.family

  if (isLoading) return <SkeletonCard rows={5} />

  if (isError || !family) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-secondary text-center py-8">
          You are not assigned to a family yet. Contact your family coordinator.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <Card padding="md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-lg">{family.name}</p>
            <p className="text-xs text-text-muted">{family.code}</p>
            {family.head && (
              <p className="text-sm text-text-secondary mt-2">
                Family head: {family.head.name}
              </p>
            )}
          </div>
          <Badge variant="default">{family.myRole.replace(/_/g, ' ')}</Badge>
        </div>
      </Card>

      <FamilyPaymentInstructionsCard
        familyName={family.name}
        headName={family.head?.name}
        payment={family.payment}
      />

      <Link
        href={membershipProfilePath(choirId, 'submit')}
        className="flex items-center gap-3 p-4 rounded-lg border border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors"
      >
        <DollarSign size={20} className="text-primary-700" />
        <div>
          <p className="font-semibold text-primary-900">Submit payment claim</p>
          <p className="text-xs text-primary-700">
            After paying to the account above, submit your claim for family confirmation.
          </p>
        </div>
      </Link>

      <Card padding="md">
        <p className="font-semibold mb-3 flex items-center gap-2">
          <Users size={16} /> Team members ({family.members.length})
        </p>
        <ul className="divide-y divide-border">
          {family.members.map((m) => (
            <li key={m.id} className="py-2.5 flex justify-between gap-2 text-sm">
              <span className={m.isMe ? 'font-semibold' : ''}>
                {m.name}
                {m.isMe ? ' (you)' : ''}
              </span>
              <span className="text-text-muted text-xs">{m.role.replace(/_/g, ' ')}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
