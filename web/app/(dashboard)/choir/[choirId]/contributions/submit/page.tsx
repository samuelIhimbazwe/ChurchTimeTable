'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ContributeClaimForm, MyContributionsList } from '@/components/choir/ContributeClaimForm'
import { choirPath } from '@/lib/choir/paths'
import { ArrowLeft } from 'lucide-react'

export default function ContributeSubmitPage() {
  const params = useParams()
  const choirId = String(params.choirId)

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-8">
      <div>
        <Link
          href={choirPath(choirId, 'member')}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 mb-2"
        >
          <ArrowLeft size={14} /> Back to my choir home
        </Link>
        <h1 className="font-display text-3xl text-text-primary">Pay contribution</h1>
        <p className="text-sm text-text-secondary mt-1">
          All choir contributions are paid to your family account, then confirmed by your family head.
        </p>
      </div>
      <ContributeClaimForm />
      <div>
        <p className="font-semibold mb-3">My contribution history</p>
        <MyContributionsList />
      </div>
    </div>
  )
}
