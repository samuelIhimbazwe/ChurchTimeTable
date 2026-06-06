'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api'
import { Card, SkeletonCard, Badge } from '@/components/shared'
import { FamilyPaymentInstructionsCard } from '@/components/choir/FamilyPaymentInstructionsCard'
import { choirPath } from '@/lib/choir/paths'
import { ArrowLeft, Users, DollarSign } from 'lucide-react'

export default function MyFamilyPage() {
  const params = useParams()
  const choirId = String(params.choirId)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['choir-my-family', choirId],
    queryFn: () => memberPortalApi.getChoirMyFamily(choirId),
  })

  const family = data?.family

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-8">
      <div>
        <Link
          href={choirPath(choirId, 'member')}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 mb-2"
        >
          <ArrowLeft size={14} /> Back to my choir home
        </Link>
        <h1 className="font-display text-3xl text-text-primary">My family</h1>
        <p className="text-sm text-text-secondary mt-1">
          Your family team — pay contributions to the account below.
        </p>
      </div>

      {isLoading && <SkeletonCard rows={4} />}
      {isError && (
        <Card padding="md">
          <p className="text-sm text-text-secondary">
            You are not assigned to a family yet. Contact your family coordinator.
          </p>
        </Card>
      )}

      {family && (
        <>
          <Card padding="md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-lg">{family.name}</p>
                <p className="text-xs text-text-muted">{family.code}</p>
                {family.head && (
                  <p className="text-sm text-text-secondary mt-2">Head: {family.head.name}</p>
                )}
              </div>
              <Badge variant="default">{family.myRole.replace(/_/g, ' ')}</Badge>
            </div>
          </Card>

          <FamilyPaymentInstructionsCard
            familyName={family.name}
            headName={family.head?.name}
            payment={family.payment}
            compact
          />

          <Link
            href={choirPath(choirId, 'contributions/submit')}
            className="flex items-center gap-3 p-4 rounded-lg border border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors"
          >
            <DollarSign size={20} className="text-primary-700" />
            <div>
              <p className="font-semibold text-primary-900">Pay contribution</p>
              <p className="text-xs text-primary-700">Submit a payment claim to your family head</p>
            </div>
          </Link>

          <Card padding="md">
            <p className="font-semibold mb-3 flex items-center gap-2">
              <Users size={16} /> Team members ({family.members.length})
            </p>
            <ul className="divide-y divide-border">
              {family.members.map((m) => (
                <li key={m.id} className="py-2 flex justify-between gap-2 text-sm">
                  <span className={m.isMe ? 'font-semibold' : ''}>
                    {m.name}{m.isMe ? ' (you)' : ''}
                  </span>
                  <span className="text-text-muted text-xs">{m.role.replace(/_/g, ' ')}</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}
