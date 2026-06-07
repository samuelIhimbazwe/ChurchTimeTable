'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { FamilyAdminPanel } from '@/components/choir/FamilyAdminPanel'
import { memberPortalApi } from '@/lib/api/modules/memberPortal'
import { useResolvedChoirScope } from '@/lib/hooks'

export default function ChoirAdminFamiliesPage() {
  const { choirId, choirLink } = useResolvedChoirScope()

  const { data: myFamily } = useQuery({
    queryKey: ['choir-my-family', choirId],
    queryFn: () => memberPortalApi.getChoirMyFamily(choirId!),
    enabled: !!choirId,
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div>
        <p className="text-xs text-text-muted mb-2">
          <Link href={choirLink('admin')} className="text-primary-600 font-semibold">
            ← Administration
          </Link>
        </p>
        <h2 className="font-display text-3xl text-text-primary">Families structure</h2>
        <p className="text-text-secondary text-sm mt-1">
          View members in each family and move singers between families. Contribution and payment
          details are only shown for your own family.
        </p>
      </div>

      <FamilyAdminPanel
        variant="structure"
        myFamilyId={myFamily?.family?.id ?? null}
      />
    </div>
  )
}
